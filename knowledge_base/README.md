# Team Defaulters Knowledge Base - Summary

## Overview
This directory contains **10 comprehensive documents** representing the internal knowledge base for "Team Defaulters" - a premium cloud infrastructure provider.

**Total Content:** ~104KB of rich, structured markdown content designed to test RAG (Retrieval-Augmented Generation) systems.

---

## Document Inventory

### 1. Company_Overview.md (3.6 KB)
**Purpose:** Company background, mission, and infrastructure  
**Key Content:**
- Mission: "Zero Downtime" cloud infrastructure
- Founded 2018, $100M ARR, 5,000+ customers
- Global data centers (9 locations across US, EU, APAC)
- Leadership team and industry recognition

---

### 2. Product_Nebula_Compute.md (6.5 KB)
**Purpose:** Flagship IaaS compute platform  
**Key Content:**
- Instance types: N-Series (general), C-Series (compute), M-Series (memory), G-Series (GPU)
- Pricing: $0.08/hour (N1.small) to $12/hour (G1.xlarge with 4x H100 GPUs)
- Autoscaling, load balancing, reserved instances
- API/CLI/Terraform support

---

### 3. Product_Vortex_Storage.md (10.6 KB)
**Purpose:** S3-compatible object storage service  
**Key Content:**
- Storage classes: Standard ($0.023/GB), IA, Glacier, Intelligent-Tiering
- 11 nines durability (99.999999999%)
- Redundancy tiers: Multi-AZ, cross-region replication
- Features: Versioning, lifecycle policies, encryption, object lock

---

### 4. Pricing_Strategy_2026.md (11.4 KB)
**Purpose:** Comprehensive pricing tiers and discounts  
**Key Content:**
- Tiers: Starter ($99), Professional ($499), Enterprise (custom)
- Volume discounts (up to 40% off)
- Reserved instances (up to 65% savings)
- **🔒 LOGIC TRAP:** Enterprise 20% discount ONLY with 2-year commitment + upfront/quarterly billing

---

### 5. Service_Level_Agreement.md (10.5 KB)
**Purpose:** Uptime guarantees and support SLAs  
**Key Content:**
- Uptime: 99.5% (Starter), 99.9% (Professional), 99.99% (Enterprise)
- **🔒 LOGIC TRAP:** 50% refund if SLA is missed
- Response times: 1-72 hours depending on tier and severity
- Service credits calculation and claim process

---

### 6. Security_Compliance.md (12.9 KB)
**Purpose:** Security certifications and practices  
**Key Content:**
- Certifications: SOC2 Type II, ISO 27001, GDPR, HIPAA, PCI DSS Level 1
- Encryption: AES-256 at rest, TLS 1.3 in transit
- DDoS protection, WAF, IDS/IPS
- Audit logging, vulnerability management, incident response

---

### 7. Startup_Program_Eligibility.md (9.7 KB)
**Purpose:** Startup credits program details  
**Key Content:**
- **🔒 LOGIC TRAP:** $5,000 credits ONLY for Series A+ funded startups
- Pre-Series A startups NOT eligible (must use Free Tier)
- Accelerator partners get $2,500 (Y Combinator, Techstars, etc.)
- 12-month validity, Professional tier support included

---

### 8. Support_Policy.md (13.2 KB)
**Purpose:** Support tiers and response times  
**Key Content:**
- Free: Email only (72h response)
- Starter: Email (24h response)
- Professional (Gold): Email + Chat (4h response)
- **Enterprise (Platinum): Email + Chat + Phone 24/7 (1h response)**
- Severity levels, escalation process, support channels

---

### 9. Case_Study_FinTech.md (13.4 KB)
**Purpose:** Success story with BankCorp  
**Key Content:**
- **40% latency reduction** (300ms → 180ms)
- **99.99% uptime** achieved (from 99.7%)
- **$2.1M annual savings** (35% cost reduction)
- Migration strategy, architecture design, results

---

### 10. Refund_Cancellation_Policy.md (12.4 KB)
**Purpose:** Refund and cancellation terms  
**Key Content:**
- **🔒 LOGIC TRAP:** No refunds after 30 days
- **🔒 LOGIC TRAP:** 15-day cancellation notice required
- Early termination fees for reserved instances
- Data retention: 30-day soft delete, then permanent deletion

---

## Logic Traps for RAG Testing

These strategic "traps" test whether the AI can correctly retrieve and apply conditional logic:

### Trap 1: Enterprise Discount (Pricing_Strategy_2026.md)
**Question:** "Do you offer discounts for Enterprise customers?"  
**Correct Answer:** "Yes, 20% discount BUT ONLY if they commit to 2+ years with upfront/quarterly billing"  
**Wrong Answer:** "Yes, 20% discount for all Enterprise customers"

### Trap 2: SLA Refund (Service_Level_Agreement.md)
**Question:** "What happens if you miss your uptime SLA?"  
**Correct Answer:** "We issue service credits equal to 50% of monthly fee"  
**Wrong Answer:** "Full refund" or "No compensation"

### Trap 3: Startup Credits (Startup_Program_Eligibility.md)
**Question:** "Can a pre-seed startup get $5,000 credits?"  
**Correct Answer:** "No, ONLY Series A+ funded startups qualify. Pre-Series A must use Free Tier or Accelerator program ($2,500)"  
**Wrong Answer:** "Yes, all startups get $5,000"

### Trap 4: Refund Window (Refund_Cancellation_Policy.md)
**Question:** "Can I get a refund if I'm unhappy after 2 months?"  
**Correct Answer:** "No, refunds ONLY within 30 days of charge"  
**Wrong Answer:** "Yes, refunds available anytime"

### Trap 5: Cancellation Notice (Refund_Cancellation_Policy.md)
**Question:** "Can I cancel my subscription today?"  
**Correct Answer:** "You can request cancellation, but need 15-day notice. You'll be charged for next cycle if <15 days to billing date"  
**Wrong Answer:** "Yes, cancel immediately with no charges"

### Trap 6: Platinum Support (Support_Policy.md)
**Question:** "Which tier gets 24/7 phone support?"  
**Correct Answer:** "Enterprise (Platinum) tier ONLY"  
**Wrong Answer:** "Professional tier" or "All paid tiers"

---

## Content Statistics

| Document | Size | Headers | Logic Traps |
|----------|------|---------|-------------|
| Company_Overview.md | 3.6 KB | 15 | 0 |
| Product_Nebula_Compute.md | 6.5 KB | 28 | 0 |
| Product_Vortex_Storage.md | 10.6 KB | 35 | 0 |
| Pricing_Strategy_2026.md | 11.4 KB | 32 | 1 |
| Service_Level_Agreement.md | 10.5 KB | 30 | 1 |
| Security_Compliance.md | 12.9 KB | 38 | 0 |
| Startup_Program_Eligibility.md | 9.7 KB | 25 | 1 |
| Support_Policy.md | 13.2 KB | 34 | 1 |
| Case_Study_FinTech.md | 13.4 KB | 28 | 0 |
| Refund_Cancellation_Policy.md | 12.4 KB | 31 | 2 |
| **TOTAL** | **104 KB** | **296** | **6** |

---

## Chunking Strategy Recommendations

For optimal RAG performance:

1. **Chunk Size:** 512-1024 tokens (with 128-token overlap)
2. **Chunking Method:** Respect markdown headers (don't split mid-section)
3. **Metadata:** Include document name, section header, and document type in metadata
4. **Embedding Model:** `all-MiniLM-L6-v2` (384 dimensions, fast, good quality)

**Example Chunk Metadata:**
```json
{
  "document": "Pricing_Strategy_2026.md",
  "section": "Enterprise Custom Pricing > Multi-Year Contracts",
  "type": "policy",
  "has_logic_trap": true
}
```

---

## Next Steps

1. ✅ **Data Generated** (Complete)
2. ⏳ **Python Ingestion Script** (Next)
   - Load markdown files
   - Chunk intelligently (respect headers)
   - Generate embeddings (HuggingFace `all-MiniLM-L6-v2`)
   - Store in Supabase with pgvector
3. ⏳ **Test RAG System** (After ingestion)
   - Query: "Can a seed-stage startup get credits?"
   - Expected: Correctly identifies Series A requirement

---

**Ready for Phase 1 Implementation!**
