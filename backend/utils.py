"""
SalesGPT - Shared Utilities

Common helpers used across backend modules to eliminate duplication
and enforce consistent behaviour.
"""

import logging
import re
import json
from typing import Dict, List, Optional


# ============================================
# Structured Logger
# ============================================

_LOG_FORMAT = "[%(levelname)s] %(name)s | %(message)s"


def get_logger(name: str) -> logging.Logger:
    """
    Return a module-level logger with a consistent format.

    Usage:
        from backend.utils import get_logger
        logger = get_logger(__name__)
        logger.info("Starting up")
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(_LOG_FORMAT))
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

    return logger


# ============================================
# Conversation Formatting
# ============================================

def format_conversation(chat_history: List[Dict[str, str]]) -> str:
    """
    Convert a list of chat messages into a human-readable transcript.

    Supports both old format (``text`` key) and new format (``content`` key).

    Args:
        chat_history: List of dicts with ``role`` and ``text``/``content`` keys.

    Returns:
        Formatted ``"Customer: …\\nAssistant: …"`` string.
    """
    lines: List[str] = []

    for msg in chat_history:
        role = "Customer" if msg["role"] == "user" else "Assistant"
        message_text = msg.get("content") or msg.get("text", "")
        lines.append(f"{role}: {message_text}")

    return "\n".join(lines)


# ============================================
# Robust JSON Extraction
# ============================================

def extract_json(raw: str) -> Optional[dict]:
    """
    Best-effort extraction of a JSON object from an LLM response.
    
    Handles:
    - Pure JSON
    - JSON wrapped in markdown code fences (with or without language specifier)
    - JSON embedded in surrounding prose
    - Escaped newlines (\\n in JSON strings)

    Returns ``None`` if no valid JSON object can be found.
    """
    if not raw:
        return None
    
    text = raw.strip()
    
    # Strategy 1: Try to parse as-is (handles pure JSON)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Remove markdown code fences (```json... ``` or ```...```)
    if "```" in text:
        lines = text.split("\n")
        content_lines = []
        in_code_block = False
        
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block or (not "```" in line):
                content_lines.append(line)
        
        cleaned_text = "\n".join(content_lines).strip()
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            pass
    
    # Strategy 3: Find the first { and match closing } by counting braces
    start_idx = text.find("{")
    if start_idx != -1:
        brace_count = 0
        end_idx = -1
        
        for i in range(start_idx, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break
        
        if end_idx != -1:
            json_str = text[start_idx:end_idx + 1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                # Try again with the raw (uncleaned) version in case there are escapes
                pass
    
    # Strategy 4: Look for JSON in raw string as last resort (handles various encodings)
    match = re.search(r"\{[\s\S]*?\}", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None
