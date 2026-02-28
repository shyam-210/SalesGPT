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
    - JSON wrapped in markdown code fences
    - JSON embedded in surrounding prose

    Returns ``None`` if no valid JSON object can be found.
    """
    text = raw.strip()

    # Strategy 1: strip markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: find the first { … } block
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None
