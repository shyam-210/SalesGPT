# SalesGPT - Cleanup Commands

## Files to Delete (Redundant SQL files)

These SQL files are now consolidated into `schema.sql`:

```powershell
# Delete old SQL files
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_add_columns.sql"
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_add_lead_columns.sql"
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_add_state_columns.sql"
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_leads_schema.sql"
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_restructure_chats.sql"
Remove-Item "d:\FinalYearProject\SalesGPT\supabase_match_documents.sql"
```

## Files to Delete (Redundant Documentation)

These are replaced by `project_status.md`:

```powershell
# Delete redundant docs
Remove-Item "d:\FinalYearProject\SalesGPT\COMMANDS.md"
Remove-Item "d:\FinalYearProject\SalesGPT\PROJECT_STRUCTURE.md"
Remove-Item "d:\FinalYearProject\SalesGPT\RUN_API.md"
Remove-Item "d:\FinalYearProject\SalesGPT\SETUP_INSTRUCTIONS.md"
Remove-Item "d:\FinalYearProject\SalesGPT\TESTING_API.md"
```

## Files to Keep

**Essential Files:**
- `schema.sql` - Complete database schema
- `README.md` - Main project documentation
- `.env` - Environment variables
- `.env.template` - Template for new setups
- `.gitignore` - Git ignore rules
- `test_backend.py` - API testing script

**Backend:**
- `backend/main.py` - FastAPI server
- `backend/judge.py` - BANT scoring
- `backend/extractor.py` - Lead extraction
- `backend/ingest.py` - PDF ingestion
- `backend/verify_data.py` - DB verification
- `backend/requirements.txt` - Python dependencies

**Frontend:**
- All files in `frontend/` (React app)

**Knowledge Base:**
- All files in `knowledge_base/` (10 markdown docs)

**Data:**
- All files in `data/` (if any test data)

## Run All Cleanup Commands

```powershell
# Navigate to project root
cd d:\FinalYearProject\SalesGPT

# Delete redundant SQL files
Remove-Item "supabase_add_columns.sql"
Remove-Item "supabase_add_lead_columns.sql"
Remove-Item "supabase_add_state_columns.sql"
Remove-Item "supabase_leads_schema.sql"
Remove-Item "supabase_restructure_chats.sql"
Remove-Item "supabase_match_documents.sql"

# Delete redundant documentation
Remove-Item "COMMANDS.md"
Remove-Item "PROJECT_STRUCTURE.md"
Remove-Item "RUN_API.md"
Remove-Item "SETUP_INSTRUCTIONS.md"
Remove-Item "TESTING_API.md"

# Verify cleanup
Get-ChildItem -File | Select-Object Name
```

## After Cleanup, Project Structure

```
SalesGPT/
├── backend/
│   ├── main.py
│   ├── judge.py
│   ├── extractor.py
│   ├── ingest.py
│   ├── verify_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── knowledge_base/
│   ├── Company_Overview.md
│   ├── Pricing_Strategy_2026.md
│   └── ... (10 files total)
├── data/
├── schema.sql              ← NEW: Complete DB schema
├── README.md
├── test_backend.py
├── .env
├── .env.template
└── .gitignore
```

## Summary

**Deleted:** 11 files (6 SQL + 5 MD)  
**Kept:** All essential code, docs, and knowledge base  
**Added:** 1 file (`schema.sql`)

**Result:** Cleaner, more organized project structure.
