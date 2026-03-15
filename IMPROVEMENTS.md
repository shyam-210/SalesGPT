# SalesGPT — Improvement Audit Log

> Comprehensive documentation of every improvement applied during the code-quality audit.  
> Date: February 28, 2026 · Branch: `improvising-salesGPT`

---

## Table of Contents

1. [Model Configuration Overhaul](#1-model-configuration-overhaul)
2. [Critical Bug Fixes](#2-critical-bug-fixes)
3. [New Shared Utilities Module](#3-new-shared-utilities-module)
4. [Structured Logging](#4-structured-logging)
5. [Code Deduplication](#5-code-deduplication)
6. [Pydantic Input Validation](#6-pydantic-input-validation)
7. [FastAPI Modernization](#7-fastapi-modernization)
8. [Frontend Fixes](#8-frontend-fixes)
9. [Database Schema Improvements](#9-database-schema-improvements)
10. [Dependency Cleanup](#10-dependency-cleanup)
11. [Environment Variable Management](#11-environment-variable-management)
12. [Files Modified Summary](#12-files-modified-summary)

---

## 1. Model Configuration Overhaul

### Before
| Role | Model | Notes |
|------|-------|-------|
| Chat (RAG) | `llama-3.1-8b-instant` | Small model, limited conversational depth |
| Judge (BANT) | `openai/gpt-oss-120b` | ✅ Correct |
| Email Draft | `openai/gpt-oss-120b` | Overkill – re-initialized per request |
| Extractor | Shared `CHAT_MODEL` | No independent override |

### After
| Role | Model | Env Var | Rationale |
|------|-------|---------|-----------|
| **Chat (RAG)** | `llama-3.3-70b-versatile` | `CHAT_MODEL` | Flagship 70B model — richer, more nuanced conversations |
| **Judge (BANT)** | `openai/gpt-oss-120b` | `JUDGE_MODEL` | High-reasoning model for accurate BANT scoring |
| **Email Draft** | `llama-3.1-8b-instant` | `EMAIL_MODEL` | Fast & cheap for templated email output; low temp (0.3) keeps it grounded |
| **Extractor** | `llama-3.1-8b-instant` | `EXTRACTOR_MODEL` | Deterministic extraction (temp 0), fast model is sufficient |
| **Embedding** | `all-MiniLM-L6-v2` | `EMBEDDING_MODEL` | Unchanged — local, zero-cost |

### Changes
- **`backend/main.py`** — `CHAT_MODEL` default → `llama-3.3-70b-versatile`, `EMAIL_MODEL` default → `llama-3.1-8b-instant`, chat `max_tokens` raised to 800
- **`backend/extractor.py`** — New `EXTRACTOR_MODEL` env var (decoupled from `CHAT_MODEL`)
- **`.env.example`**, **`.env.template`** — All model vars documented
- **`README.md`** — Tech stack table updated to reflect actual models

---

## 2. Critical Bug Fixes

### 2.1 Conversations Never Persisted to Database (CRITICAL)

**Problem:** The `/chat` endpoint stored messages in an in-memory `chat_sessions` dict but _never_ wrote them to the Supabase `conversations` table. The `/draft_email` endpoint reads from `conversations` to build email context — so it always found empty history.

**Fix:** Added `_persist_messages()` background task that writes both the user and assistant messages to the `conversations` table after every chat turn.

**File:** `backend/main.py` — new helper function + background task in `/chat`

---

### 2.2 `last_active` Never Updated (CRITICAL)

**Problem:** The `leads.last_active` column was only set at row creation. The time-decay cron (`cron.py`) uses `last_active` to decide if a lead is inactive — but since it was never updated, every lead appeared stale.

**Fix:** `_persist_messages()` now also touches `last_active` and `updated_at` with the current UTC timestamp on every chat message.

**File:** `backend/main.py`

---

### 2.3 `"updated_at": "NOW()"` Stored a Literal String (CRITICAL)

**Problem:** In `PATCH /leads/{session_id}`, the code passed `"updated_at": "NOW()"`. Supabase PostgREST treats this as the _string_ `"NOW()"`, not a SQL function call. The `updated_at` column would contain `NOW()` as text (or fail silently).

**Fix:** Replaced with `datetime.now(timezone.utc).isoformat()` which generates a proper ISO 8601 timestamp.

**File:** `backend/main.py` — `update_lead_status` endpoint

---

### 2.4 Email Model Re-Initialized Per Request (PERF)

**Problem:** Every call to `/draft_email` created a new `ChatGroq` instance. This adds latency and allocates unnecessary objects.

**Fix:** Email model is now a module-level singleton, initialized once at startup alongside the chat model.

**File:** `backend/main.py` — `email_model = ChatGroq(...)` at module level

---

### 2.5 Judge JSON Parsing Had No Fallback

**Problem:** `judge.py` used bare `json.loads()` — if the Judge LLM returned JSON wrapped in markdown fences or with surrounding text, parsing failed and the lead got a score of 0.

**Fix:** Now uses the shared `extract_json()` utility which tries: (1) direct parse, (2) strip markdown fences, (3) regex extraction of `{ ... }`.

**File:** `backend/judge.py`

---

### 2.6 Extractor JSON Parsing Had No Regex Fallback

**Problem:** `extractor.py` stripped markdown fences but had no regex fallback if the LLM wrapped JSON in prose.

**Fix:** Now uses shared `extract_json()` — same robust 3-strategy approach.

**File:** `backend/extractor.py`

---

### 2.7 Bare `except:` Clause

**Problem:** In `main.py`, the lead-profile fetch used a bare `except:` which catches `SystemExit`, `KeyboardInterrupt`, etc.

**Fix:** Changed to `except Exception as exc:` with a `logger.warning()`.

**File:** `backend/main.py`

---

## 3. New Shared Utilities Module

**Created:** `backend/utils.py`

Centralizes three commonly needed helpers:

| Function | Purpose |
|----------|---------|
| `get_logger(name)` | Returns a structured logger with consistent `[LEVEL] module \| message` format |
| `format_conversation(chat_history)` | Converts message list → `"Customer: …\nAssistant: …"` string |
| `extract_json(raw)` | Robust JSON extraction: direct parse → strip fences → regex `{…}` |

**Consumers:** `main.py`, `judge.py`, `extractor.py`, `cron.py`

---

## 4. Structured Logging

### Before
Every module used ad-hoc `print()` statements with inconsistent prefixes like `[OK]`, `[ERROR]`, `[AI]`, `[DATA]`, etc.

### After
All server modules use `logger = get_logger(__name__)` from `backend.utils`. Benefits:

- **Consistent format:** `[LEVEL] backend.main | message`
- **Severity levels:** `DEBUG`, `INFO`, `WARNING`, `ERROR` (filterable)
- **`exc_info=True`:** Stack traces attached to error log entries automatically
- **No `import traceback` inside except blocks** — moved to top-level or removed entirely

### Files Changed
- `backend/main.py` — all ~20 `print()` → `logger.*`
- `backend/judge.py` — all ~10 `print()` → `logger.*`
- `backend/extractor.py` — all ~8 `print()` → `logger.*`
- `backend/cron.py` — all ~5 `print()` → `logger.*`

> **Note:** `ingest.py` and `verify_data.py` remain as CLI scripts with `print()` — this is intentional since they're run manually and print is idiomatic for CLI tools.

---

## 5. Code Deduplication

### `format_conversation()` — 3 copies → 1

**Before:** Identical `format_conversation()` existed in:
- `backend/judge.py`
- `backend/extractor.py`
- (Inline in `main.py` as ad-hoc string building)

**After:** Single canonical implementation in `backend/utils.py`. Both `judge.py` and `extractor.py` import it.

### `extract_json()` — 3 inline patterns → 1

**Before:** JSON parsing with markdown-fence stripping was duplicated in:
- `main.py` (draft_email)
- `judge.py` (analyze_lead)
- `extractor.py` (extract_lead_data)

Each had slightly different fallback strategies (some had regex, some didn't).

**After:** Single `extract_json()` in `utils.py` with the most robust strategy (3 fallbacks).

---

## 6. Pydantic Input Validation

### Before
```python
class ChatRequest(BaseModel):
    message: str
    session_id: str
```

No length limits, no pattern validation — any string accepted.

### After
```python
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)
    session_id: str = Field(..., min_length=1, max_length=128)

class UpdateLeadStatusRequest(BaseModel):
    pipeline_status: str = Field(
        ...,
        pattern=r"^(Visitor|Engaged|Qualified|Hot Lead|Approached)$",
    )
```

- Empty messages rejected at the API boundary
- Session IDs capped at 128 chars
- Pipeline status must be one of the 5 valid stages (regex-enforced)

**File:** `backend/main.py`

---

## 7. FastAPI Modernization

### Deprecated `@app.on_event("startup")` → `lifespan`

**Before:**
```python
@app.on_event("startup")
async def startup():
    print("Starting...")
```

`on_event` has been deprecated since FastAPI 0.93.

**After:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SalesGPT API Starting...")
    yield
    logger.info("SalesGPT API shutting down.")

app = FastAPI(..., lifespan=lifespan)
```

**File:** `backend/main.py`

---

## 8. Frontend Fixes

### 8.1 Dynamic Tailwind Classes Purged at Build Time (BUG)

**Problem:** `Dashboard.jsx` used template-literal Tailwind classes like:
```jsx
className={`bg-${color}-900/40 text-${color}-400 border-${color}-700/50`}
```
Tailwind's JIT compiler cannot detect dynamic class names — they get purged in production builds, leaving unstyled elements.

**Fix:** Added explicit `STAGE_BADGE_STYLES` map:
```jsx
const STAGE_BADGE_STYLES = {
    slate:   'bg-slate-900/40 text-slate-400 border-slate-700/50',
    blue:    'bg-blue-900/40 text-blue-400 border-blue-700/50',
    // ...
}
```

**File:** `frontend/src/components/Dashboard.jsx`

---

### 8.2 Deprecated `substr()` → `slice()` 

**Problem:** `ChatWidget.jsx` used `Math.random().toString(36).substr(2, 9)`. `String.prototype.substr()` is deprecated in modern JS.

**Fix:** Replaced with `.slice(2, 11)`.

**File:** `frontend/src/components/ChatWidget.jsx`

---

### 8.3 Hardcoded API URLs → Environment Variable

**Problem:** API URL `http://localhost:8000` was hardcoded in both `Dashboard.jsx` and `ChatWidget.jsx`. This breaks in any deployed environment.

**Fix:** Both now read `import.meta.env.VITE_API_URL || 'http://localhost:8000'`.

**Files:** `Dashboard.jsx`, `ChatWidget.jsx`

---

### 8.4 Supabase Client Missing Env Validation

**Problem:** `supabase.js` called `createClient(undefined, undefined)` silently if env vars were missing — causing cryptic runtime errors.

**Fix:** Added validation with `console.error()` warning, plus nullish coalescing fallback.

**File:** `frontend/src/lib/supabase.js`

---

## 9. Database Schema Improvements

### Auto-Update Trigger for `updated_at`

**Problem:** The `leads.updated_at` column relied on application code to set it — inconsistent and easy to forget.

**Fix:** Added a PostgreSQL trigger:
```sql
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
```

Now `updated_at` is automatically set on every row update, regardless of which backend module makes the change.

**File:** `schema.sql`

---

## 10. Dependency Cleanup

### Before (`requirements.txt`) — 21 packages
Included unused:
- `pydantic-settings` (not imported anywhere)
- `aiofiles` (not imported)
- `python-jose[cryptography]` (no JWT auth)
- `passlib[bcrypt]` (no password hashing)
- `tiktoken` (not imported)
- `pypdf` (not imported — data is markdown)
- `markdown` (not imported)

### After — 14 packages
Removed all unused packages. Added version range pins (`>=x.y,<z.0`) for core dependencies to ensure reproducible builds without being overly restrictive.

**File:** `backend/requirements.txt`

---

## 11. Environment Variable Management

### Created `.env.example`

A fully documented template with every env var used across frontend and backend:

```dotenv
# Supabase
SUPABASE_URL, SUPABASE_KEY

# Groq
GROQ_API_KEY

# Models (each role has its own var)
CHAT_MODEL, EMAIL_MODEL, JUDGE_MODEL, EXTRACTOR_MODEL, EMBEDDING_MODEL

# Config
TOP_K_RESULTS, ALLOWED_ORIGINS

# Frontend (Vite prefix)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
```

### Updated `.env.template`
- Added `EMAIL_MODEL` and `EXTRACTOR_MODEL` 
- Updated `CHAT_MODEL` default to `llama-3.3-70b-versatile`
- Added descriptive comments for each model role

---

## 12. Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| `backend/utils.py` | **NEW** | Shared logger, `format_conversation`, `extract_json` |
| `backend/main.py` | Modified | 15+ fixes: persistence, models, logging, lifespan, validation |
| `backend/judge.py` | Modified | Deduplication, robust JSON, logging, removed unused imports |
| `backend/extractor.py` | Modified | Deduplication, robust JSON, logging, removed `Optional`/`json` |
| `backend/cron.py` | Modified | Top-level `traceback`, structured logging |
| `backend/email_intent_prompts.py` | Modified | Documented unused `stage` parameter |
| `backend/requirements.txt` | Modified | Removed 7 unused deps, added version pins |
| `frontend/src/components/Dashboard.jsx` | Modified | Tailwind purge fix, env var API URL |
| `frontend/src/components/ChatWidget.jsx` | Modified | `substr` → `slice`, env var API URL |
| `frontend/src/lib/supabase.js` | Modified | Env var validation |
| `schema.sql` | Modified | `updated_at` auto-trigger |
| `.env.example` | **NEW** | Complete env var template |
| `.env.template` | Modified | Updated model vars + comments |
| `README.md` | Modified | Tech stack table + architecture diagram |
| `IMPROVEMENTS.md` | **NEW** | This document |

---

## Architecture After Improvements

```
┌──────────────────────────────────────────────────────────┐
│  FAST TRACK (Foreground)                                  │
│  Chat Model: llama-3.3-70b-versatile (temp 0.7, 800 tok) │
│  Embedding:  all-MiniLM-L6-v2 (local, 384d)              │
│  → RAG retrieval + LLM response → Supabase persist        │
└──────────────────────────────────────────────────────────┘
                         │ Background Tasks
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────────┐
   │   Judge     │ │ Extractor  │ │ Persist Msgs   │
   │ gpt-oss-   │ │ llama-3.1  │ │ → conversations │
   │ 120b       │ │ -8b-instant│ │ → last_active   │
   │ (BANT)     │ │ (contacts) │ │                 │
   └────────────┘ └────────────┘ └────────────────┘

  Email Draft: llama-3.1-8b-instant (temp 0.3, 1024 tok)
  Time Decay:  Cron job (24h threshold, 0.9 factor)
```
