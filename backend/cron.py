"""
SalesGPT - Time-Decay Automation
Reduces lead scores for inactive users to reflect fading interest.

Logic:
  - Targets leads in Visitor / Engaged / Qualified stages only
  - If last_active > 24 hours ago: score *= 0.9  (10% decay)
  - If a Qualified lead drops below 70, downgrade to Engaged
  - Approached / Hot Lead that went cold are left for manual review
"""

import os
import math
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================
# Time-Decay Function
# ============================================

DECAY_STAGES = ("Visitor", "Engaged", "Qualified")
INACTIVE_THRESHOLD_HOURS = 24
DECAY_FACTOR = 0.9  # 10 % reduction


def apply_time_decay() -> dict:
    """
    Apply time-decay to all eligible leads.

    Returns a summary dict: { updated: int, skipped: int, details: [...] }
    """
    summary = {"updated": 0, "skipped": 0, "details": []}

    try:
        # Fetch eligible leads (not Approached, not Hot Lead)
        result = (
            supabase_client.table("leads")
            .select("*")
            .in_("pipeline_status", list(DECAY_STAGES))
            .execute()
        )

        leads = result.data or []
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=INACTIVE_THRESHOLD_HOURS)

        print(f"[DECAY] Checking {len(leads)} leads for inactivity (cutoff: {cutoff.isoformat()})")

        for lead in leads:
            session_id = lead["session_id"]
            old_score = lead.get("lead_score", 0)
            old_stage = lead.get("pipeline_status", "Visitor")

            # Determine last activity timestamp
            last_active_str = lead.get("last_active") or lead.get("updated_at") or lead.get("created_at")
            if not last_active_str:
                summary["skipped"] += 1
                continue

            # Parse ISO timestamp
            try:
                last_active = datetime.fromisoformat(last_active_str.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                summary["skipped"] += 1
                continue

            if last_active >= cutoff:
                # Still active — skip
                summary["skipped"] += 1
                continue

            # Apply decay
            new_score = max(0, math.floor(old_score * DECAY_FACTOR))
            new_stage = old_stage

            # Downgrade Qualified -> Engaged if score drops below 70
            if old_stage == "Qualified" and new_score < 70:
                new_stage = "Engaged"

            # Downgrade Engaged -> Visitor if score drops below 31
            if new_stage == "Engaged" and new_score < 31:
                new_stage = "Visitor"

            # Skip if nothing changed
            if new_score == old_score and new_stage == old_stage:
                summary["skipped"] += 1
                continue

            # Update in Supabase
            supabase_client.table("leads").update({
                "lead_score": new_score,
                "pipeline_status": new_stage,
            }).eq("session_id", session_id).execute()

            detail = f"{session_id[:20]}... {old_score}->{new_score} ({old_stage}->{new_stage})"
            summary["details"].append(detail)
            summary["updated"] += 1
            print(f"  [DECAY] {detail}")

        print(f"[DECAY] Done: {summary['updated']} updated, {summary['skipped']} skipped")

    except Exception as e:
        print(f"[ERROR] Time-decay error: {e}")
        import traceback
        traceback.print_exc()
        summary["error"] = str(e)

    return summary
