# Helper function for email generation

def build_email_prompt(lead: dict, conversation: str, intent: str, context: str) -> str:
    """
    Build email prompt using intent and context from Judge.
    Simple, context-aware generation without complex templates.
    """
    
    prompt = f"""You are a B2B Sales Representative for Team Defaulters, a cloud infrastructure company.

LEAD INFORMATION:
- Name: {lead.get('name') or 'there'}
- Company: {lead.get('company') or 'N/A'}
- Role: {lead.get('role') or 'N/A'}
- Lead Score: {lead.get('lead_score')}/100

EMAIL PURPOSE: {intent}
WHAT THEY ASKED FOR: {context}

CONVERSATION HISTORY:
{conversation}

YOUR TASK:
Write a professional follow-up email that addresses what the customer asked for.

CRITICAL RULES:
1. **USE ONLY INFORMATION FROM THE CONVERSATION ABOVE**
   - Extract exact pricing numbers if they were discussed
   - Include specific technical specs if they were mentioned
   - Reference actual benefits/features that were talked about
   - DO NOT make up details that weren't in the conversation

2. **BE SPECIFIC**
   - If pricing was discussed: Include exact numbers (e.g., "$332,800-$499,200/year with 20% discount")
   - If specs were mentioned: Include exact details (e.g., "G1.xlarge with A100 GPUs, 16 vCPUs, 32GB RAM")
   - If benefits were discussed: List them specifically (e.g., "99.99% uptime SLA, 24/7 support")

3. **DO NOT make up contact details**
   - Sign as "Team Defaulters" ONLY
   - No fake names, emails, or calendar links

4. **STRUCTURE**
   - Subject: Clear and relevant to their request
   - Body: 2-3 paragraphs addressing their specific ask
   - Use their name: {lead.get('name') or 'there'}
   - Simple CTA: "Let me know if you have questions"
   - Signature: "Best regards,\\nTeam Defaulters"

5. **FORMAT**
   - Return ONLY valid JSON with "subject" and "body" fields
   - No additional text or explanations

Generate the email now (JSON only):"""
    
    return prompt
