"""
SalesGPT - Dynamic Email Generation
Builds email prompts purely from BANT analysis, email intent, and conversation facts.
"""


# ============================================
# Intent-Specific Content Directives
# ============================================

INTENT_DIRECTIVES = {
    "pricing_request": {
        "focus": "Pricing details the customer asked about",
        "must_include": [
            "Exact pricing numbers discussed (monthly/annual costs)",
            "Instance types and their costs",
            "Any discounts or credits mentioned (e.g., annual commitment savings, startup credits)",
            "Tier/plan names referenced",
        ],
        "structure": (
            "1. Greeting referencing their pricing inquiry\n"
            "2. Pricing summary table/list with EXACT numbers from conversation\n"
            "3. Any applicable discounts or savings mentioned\n"
            "4. Brief next step"
        ),
    },
    "technical_specs": {
        "focus": "Technical specifications the customer requested",
        "must_include": [
            "Instance types with exact specs (vCPUs, RAM, storage, GPU)",
            "Performance characteristics discussed",
            "Any architecture recommendations given",
            "Relevant SLA or uptime guarantees mentioned",
        ],
        "structure": (
            "1. Greeting referencing their technical inquiry\n"
            "2. Specs breakdown with EXACT numbers from conversation\n"
            "3. How specs map to their use case\n"
            "4. Brief next step"
        ),
    },
    "plan_comparison": {
        "focus": "Plan or instance type comparison the customer wanted",
        "must_include": [
            "Each plan/instance discussed with key differences",
            "Pricing for each option",
            "Feature differences highlighted",
            "Recommendation given during conversation",
        ],
        "structure": (
            "1. Greeting referencing their comparison request\n"
            "2. Side-by-side summary of options discussed\n"
            "3. Recommendation based on their stated needs\n"
            "4. Brief next step"
        ),
    },
    "startup_program": {
        "focus": "Startup program details the customer asked about",
        "must_include": [
            "Credit amount discussed (e.g., $5,000)",
            "Program duration and benefits",
            "Eligibility criteria mentioned",
            "How to apply",
        ],
        "structure": (
            "1. Greeting referencing their startup program interest\n"
            "2. Program benefits with EXACT details from conversation\n"
            "3. Eligibility and next steps\n"
            "4. Brief next step"
        ),
    },
    "custom_solution": {
        "focus": "Custom architecture or solution discussed",
        "must_include": [
            "The specific problem/use case they described",
            "Solution components recommended",
            "Estimated costs if discussed",
            "Implementation timeline if mentioned",
        ],
        "structure": (
            "1. Greeting referencing their custom requirements\n"
            "2. Proposed solution summary from conversation\n"
            "3. Costs and timeline if discussed\n"
            "4. Brief next step"
        ),
    },
    "general_followup": {
        "focus": "General follow-up based on conversation topics",
        "must_include": [
            "Key topics discussed",
            "Any specific questions they had",
            "Relevant information shared",
        ],
        "structure": (
            "1. Greeting referencing conversation topic\n"
            "2. Summary of what was discussed\n"
            "3. Brief next step"
        ),
    },
}


# ============================================
# Tone Mapping from BANT Score
# ============================================

def _get_tone_from_bant(score: int, stage: str = "") -> str:
    """Derive email tone from BANT score so the email matches lead warmth.
    
    Args:
        score: BANT score (0-100).
        stage: Pipeline stage (reserved for future per-stage overrides).
    """
    if score >= 71:
        return (
            "Warm and action-oriented. This is a hot lead — they have budget, "
            "authority, need, and urgency. Be direct, reference their specific "
            "requirements, and propose a clear next step (demo, call, trial)."
        )
    if score >= 51:
        return (
            "Professional and consultative. This is a qualified lead — they "
            "have a real need. Reinforce the value discussed, include the "
            "specifics they asked for, and gently suggest a follow-up."
        )
    if score >= 31:
        return (
            "Friendly and informative. This lead is engaged but still "
            "exploring. Provide the information they requested clearly and "
            "invite them to ask more questions."
        )
    return (
        "Light and helpful. This is an early-stage visitor. Keep it short, "
        "share what was discussed, and leave the door open."
    )


# ============================================
# Main Prompt Builder
# ============================================

def build_email_prompt(
    lead: dict,
    conversation: str,
    intent: str,
    context: str,
) -> str:
    """
    Build a high-accuracy email prompt driven entirely by:
      - BANT analysis  (score, stage, reasoning stored in lead)
      - Email intent    (what the customer asked for)
      - Email context   (specific facts extracted by Judge)
      - Conversation    (the single source of truth for all numbers/details)

    Returns a system-level prompt string for the LLM.
    """

    name = lead.get("name") or "there"
    company = lead.get("company") or ""
    role = lead.get("role") or ""
    score = lead.get("lead_score", 0)
    stage = lead.get("pipeline_status", "Visitor")
    bant_reasoning = lead.get("notes", "")
    needs = lead.get("needs", "")

    # Resolve intent directive (fall back to general)
    directive = INTENT_DIRECTIVES.get(intent, INTENT_DIRECTIVES["general_followup"])
    tone = _get_tone_from_bant(score, stage)

    # Build the must-include checklist
    must_include_list = "\n".join(f"  - {item}" for item in directive["must_include"])

    # Company/role line (only if available)
    company_line = f"  Company: {company}" if company else ""
    role_line = f"  Role: {role}" if role else ""
    needs_line = f"  Needs: {needs}" if needs else ""
    bant_line = f"  BANT Assessment: {bant_reasoning}" if bant_reasoning else ""

    prompt = f"""You are a B2B Sales Representative for Team Defaulters, a cloud infrastructure company.
Your task: write a follow-up email that is **100 % grounded in the conversation below**.

=====================  LEAD PROFILE  =====================
  Name: {name}
{company_line}
{role_line}
  Lead Score: {score}/100  |  Stage: {stage}
{needs_line}
{bant_line}

=====================  EMAIL INTENT  =====================
  Intent Category : {intent}
  Focus           : {directive["focus"]}
  Key Facts (from BANT analysis):
    {context if context else "No specific details extracted — rely on conversation."}

=====================  CONVERSATION (SOURCE OF TRUTH)  =====================
{conversation}

=====================  GENERATION RULES  =====================

ACCURACY — ZERO HALLUCINATION:
  1. Every number, price, spec, discount, credit, SLA, and feature you
     include MUST appear verbatim in the CONVERSATION or KEY FACTS above.
  2. If a detail was NOT discussed, do NOT include it. Omit rather than guess.
  3. Do NOT invent contact info, calendar links, or support emails.

WHAT TO INCLUDE:
{must_include_list}

EMAIL STRUCTURE:
{directive["structure"]}

TONE:
{tone}

FORMAT RULES:
  - Address the customer as "{name}"
  - Subject line: concise, relevant to their request
  - Body: 2-4 short paragraphs (no filler, every sentence adds value)
  - End with a simple CTA: "Let me know if you have any questions."
  - Signature: "Best regards,\\nTeam Defaulters"
  - Return ONLY valid JSON: {{"subject": "...", "body": "..."}}
  - No markdown, no code fences, no extra text outside the JSON

Generate the email now (JSON only):"""

    return prompt
