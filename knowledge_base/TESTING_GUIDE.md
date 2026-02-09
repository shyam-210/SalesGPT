# 🎯 Quick Reference: Logic Traps for Testing

## Test Questions for RAG System

### ❌ TRAP 1: Enterprise Discount
**User Question:** "I'm interested in the Enterprise plan. Do you offer any discounts?"

**Expected AI Response:**  
"Yes! The Enterprise plan includes a **20% discount on top of standard pricing**, but this is ONLY available if you commit to a **minimum 2-year contract** with **upfront annual payment or quarterly billing** (monthly billing is not eligible). You'll also need a minimum $100,000 annual spend."

**Wrong Response:**  
"Yes, Enterprise customers get 20% off!" (Missing the 2-year + payment terms requirement)

---

### ❌ TRAP 2: SLA Refund
**User Question:** "What happens if your service goes down and you miss your 99.99% uptime guarantee?"

**Expected AI Response:**  
"If we fail to meet our uptime SLA, we will issue **service credits equal to 50% of your monthly service fee** for the affected service. For example, if you're on the Professional tier ($499/month) and we miss the SLA, you'd receive $249.50 in credits. Credits are capped at 100% of your monthly fee and must be claimed within 30 days."

**Wrong Response:**  
"We'll give you a full refund" or "We'll compensate you" (without specifying 50%)

---

### ❌ TRAP 3: Startup Credits Eligibility
**User Question:** "We're a pre-seed startup with a great idea. Can we get the $5,000 startup credits?"

**Expected AI Response:**  
"Unfortunately, the $5,000 startup credit program requires that you have **raised Series A funding or later**. Pre-Series A startups are not eligible. However, you have these options:
1. Use our **Free Tier** (750 hours/month of N1.small + 5 GB storage)
2. If you're part of Y Combinator, Techstars, or other partner accelerators, you can get **$2,500 in credits** instead
3. Once you raise Series A, you can apply for the full $5,000 program"

**Wrong Response:**  
"Yes, all startups get $5,000 credits!" (Missing the Series A requirement)

---

### ❌ TRAP 4: Refund Window
**User Question:** "I've been using your service for 2 months but I'm not happy. Can I get a refund?"

**Expected AI Response:**  
"I'm sorry to hear you're not satisfied. Unfortunately, our refund policy only allows refunds **within 30 days of the initial charge**. Since you've been with us for 2 months, you're past the 30-day refund window, so **no refund can be issued**. However, you can cancel your subscription at any time (with 15-day notice). Is there anything we can help with to improve your experience?"

**Wrong Response:**  
"Yes, we can process a refund" or "Let me check with billing" (No refunds after 30 days, period)

---

### ❌ TRAP 5: Cancellation Notice
**User Question:** "I want to cancel my subscription today. My billing date is in 10 days. Will I be charged again?"

**Expected AI Response:**  
"Yes, you will be charged for the next billing cycle. Our cancellation policy requires **15 days' advance notice**. Since your billing date is in 10 days, that's less than the required 15-day notice period. You'll be charged for the next month, but the cancellation will take effect after that cycle. To avoid future charges, I recommend canceling now so it takes effect after the upcoming billing cycle."

**Wrong Response:**  
"No problem, I'll cancel it immediately and you won't be charged" (Incorrect - 15-day notice required)

---

### ❌ TRAP 6: Phone Support Availability
**User Question:** "I'm on the Professional plan. Can I call you if I have an urgent issue?"

**Expected AI Response:**  
"The Professional tier includes email and live chat support, but **phone support is only available on the Enterprise (Platinum) tier**. For urgent Severity 1 issues, you can email support@teamdefaulters.com and we'll respond within 4 hours (24/7 monitoring for critical issues). If you need phone support, you can either:
1. Upgrade to Enterprise tier
2. Add the Premium Support add-on (+$500/month) which includes phone support during business hours"

**Wrong Response:**  
"Yes, you can call us at..." (Professional tier does NOT include phone support)

---

## Scoring Rubric

**Perfect Response (100%):**
- Correctly identifies the conditional requirement
- States the exception/limitation clearly
- Provides alternative options when applicable

**Partial Response (50%):**
- Identifies the general policy but misses the specific condition
- Example: "Startups get credits" (missing "Series A only")

**Failed Response (0%):**
- Completely wrong information
- Hallucinates policies that don't exist
- Ignores the documented restrictions

---

## Testing Methodology

1. **Ask the question** to your RAG-powered chatbot
2. **Compare response** to expected answer
3. **Check for:**
   - ✅ Correct conditional logic ("ONLY if...")
   - ✅ Specific numbers/timeframes (50%, 30 days, 15 days, etc.)
   - ✅ Alternatives offered when user doesn't qualify
4. **Score** based on rubric above

---

## Advanced Test: Multi-Hop Reasoning

**User Question:** "We're a Series A startup that raised $10M last month. We want the Enterprise plan with the 20% discount and the startup credits. What's our total first-month cost?"

**Expected AI Response:**  
"Great! As a Series A startup, you're eligible for the **$5,000 startup credits**. However, the **Enterprise plan's 20% discount requires a 2-year commitment**, which you'll need to discuss with our sales team for custom pricing.

Here's what happens:
1. **Startup Credits:** $5,000 (valid for 12 months)
2. **Enterprise Pricing:** Custom quote from sales (contact sales@teamdefaulters.com)
3. **First Month:** Your startup credits will cover most or all of your first month's usage, depending on your consumption

**Important:** You cannot stack the startup credits with other promotional discounts, but the Enterprise 2-year discount is a contract-level discount, not a promotion, so it should be compatible. I recommend contacting our sales team to get a custom quote that factors in both benefits."

**This tests:**
- ✅ Series A eligibility for credits
- ✅ Enterprise 2-year requirement
- ✅ Understanding that credits are applied to usage, not subscription fees
- ✅ Knowing when to escalate to sales (custom pricing)

---

**Use these tests after implementing your RAG system to validate accuracy!**
