# Team Defaulters - Service Level Agreement (SLA)

**Effective Date:** January 1, 2026  
**Version:** 2.1

## Overview

This Service Level Agreement ("SLA") defines the uptime commitments, support response times, and remediation policies for Team Defaulters cloud services. This SLA applies to all customers with paid subscriptions (Starter, Professional, or Enterprise tiers).

**Important:** Pay-as-you-go customers without a subscription tier do NOT receive SLA guarantees and are provided services on a best-effort basis.

## Uptime Commitments

### Definitions

**"Uptime"** is calculated as:
```
Uptime % = (Total Minutes in Month - Downtime Minutes) / Total Minutes in Month × 100
```

**"Downtime"** means:
- Service is unavailable for more than 1 minute continuously
- Error rate exceeds 5% of requests over a 5-minute period
- Latency exceeds 10x normal baseline for more than 5 minutes

**"Scheduled Maintenance"** is NOT counted as downtime if:
- Announced at least 7 days in advance
- Performed during maintenance windows (Sundays 2-6 AM UTC)
- Does not exceed 4 hours per month

### Uptime Guarantees by Tier

| Service Tier | Monthly Uptime Guarantee | Max Allowed Downtime/Month |
|--------------|--------------------------|----------------------------|
| Starter | 99.5% | ~3.6 hours |
| Professional | 99.9% | ~43 minutes |
| Enterprise | 99.99% | ~4.3 minutes |
| Enterprise Premium | 99.995% | ~2.2 minutes |

### Service-Specific SLAs

#### Nebula Compute

**Uptime Guarantee:** As per tier above

**Measured By:**
- Instance availability (ability to connect via SSH/RDP)
- API availability (ability to start/stop instances)

**Exclusions:**
- Instance failures due to customer misconfiguration
- OS-level crashes (customer's responsibility)
- Network issues outside Team Defaulters' control
- DDoS attacks (unless customer purchased DDoS protection)

#### Vortex Storage

**Uptime Guarantee:** As per tier above

**Measured By:**
- Ability to PUT objects
- Ability to GET objects
- API availability

**Data Durability:** 99.999999999% (11 nines) annually

**Exclusions:**
- Data loss due to customer deletion
- Bucket policy misconfigurations
- Accidental overwrites

#### Load Balancers

**Uptime Guarantee:** As per tier above

**Measured By:**
- Ability to route traffic to healthy backends
- Health check functionality

#### Networking (VPC, VPN)

**Uptime Guarantee:** As per tier above

**Measured By:**
- Connectivity between instances in same VPC
- VPN gateway availability

## Service Credits (Financial Remediation)

### Credit Calculation

**🔒 CRITICAL POLICY:**  
If Team Defaulters fails to meet the uptime guarantee for your tier, we will issue **service credits equal to 50% of your monthly service fee** for the affected service.

**Example:**
- You have a Professional tier subscription ($499/month)
- Nebula Compute experiences 2 hours of downtime (99.7% uptime)
- Your tier guarantees 99.9% uptime
- **Credit issued: $249.50 (50% of monthly fee)**

### Credit Tiers by Uptime Achievement

| Actual Uptime | Service Credit |
|---------------|----------------|
| ≥ 99.99% | 0% (SLA met for Enterprise) |
| 99.9% - 99.98% | 0% (SLA met for Professional) |
| 99.5% - 99.89% | 0% (SLA met for Starter) |
| 99.0% - 99.49% | 10% of monthly fee |
| 98.0% - 98.99% | 25% of monthly fee |
| 95.0% - 97.99% | 50% of monthly fee |
| < 95.0% | 100% of monthly fee |

**Important Notes:**
1. Credits are capped at 100% of monthly fee (no cash refunds)
2. Credits apply only to the affected service (e.g., if Nebula Compute fails but Vortex is fine, credit applies only to compute portion)
3. Credits must be claimed within 30 days of the incident
4. Credits expire after 12 months if unused

### How to Claim Credits

1. **Submit a ticket** at support.teamdefaulters.com within 30 days
2. **Include:**
   - Date and time of downtime (UTC)
   - Affected services/resources
   - Evidence (screenshots, logs, monitoring data)
3. **Team Defaulters will investigate** within 5 business days
4. **Credits issued** within 10 business days if claim is valid

**Credit Application:**
- Credits automatically apply to next month's invoice
- Cannot be redeemed for cash
- Cannot be transferred to another account

## Support Response Times

### Support Channels by Tier

| Tier | Email | Chat | Phone | Slack |
|------|-------|------|-------|-------|
| Starter | ✅ | ❌ | ❌ | ❌ |
| Professional | ✅ | ✅ | ❌ | ❌ |
| Enterprise | ✅ | ✅ | ✅ | ✅ |

### Response Time Commitments

Response times are based on **severity level** and **tier**.

#### Severity Levels

**Severity 1 (Critical):**
- Production system down
- Data loss or corruption
- Security breach
- Complete service unavailability

**Severity 2 (High):**
- Major feature not working
- Significant performance degradation
- Workaround available but not ideal

**Severity 3 (Medium):**
- Minor feature issue
- General questions
- Feature requests

**Severity 4 (Low):**
- Documentation questions
- Cosmetic issues
- General inquiries

#### Response Time SLA

| Severity | Starter | Professional | Enterprise |
|----------|---------|--------------|------------|
| Severity 1 | 24 hours | 4 hours | 1 hour |
| Severity 2 | 48 hours | 12 hours | 4 hours |
| Severity 3 | 5 business days | 24 hours | 8 hours |
| Severity 4 | 7 business days | 48 hours | 24 hours |

**"Response Time"** means:
- Initial acknowledgment of ticket
- Assignment to support engineer
- NOT resolution time (resolution depends on issue complexity)

### Support Hours

**Starter & Professional:**
- Email/Chat: Monday-Friday, 9 AM - 6 PM Pacific Time
- Severity 1 issues: 24/7 emergency email monitored

**Enterprise:**
- 24/7/365 coverage for all severity levels
- Dedicated Slack channel with <15 minute response time during business hours

## Maintenance Windows

### Scheduled Maintenance

**Standard Window:**
- **When:** Sundays, 2:00 AM - 6:00 AM UTC
- **Frequency:** Up to 2 times per month
- **Notification:** 7 days advance notice via email + status page

**Emergency Maintenance:**
- Critical security patches may require immediate maintenance
- Notification: Minimum 4 hours advance notice (if possible)
- Performed only when absolutely necessary

**Maintenance Exclusions:**
- Scheduled maintenance does NOT count against uptime SLA
- Emergency maintenance DOES count against uptime SLA (eligible for credits)

## Monitoring & Status Page

### Public Status Page

Real-time service status: **status.teamdefaulters.com**

**Information Provided:**
- Current operational status (Operational, Degraded, Outage)
- Ongoing incidents
- Scheduled maintenance
- Historical uptime (90 days)

**Subscribe to Alerts:**
- Email notifications
- SMS notifications (Enterprise only)
- Slack/PagerDuty webhooks (Enterprise only)

### Incident Communication

During outages, we commit to:
1. **Initial Update:** Within 15 minutes of detection
2. **Progress Updates:** Every 30 minutes until resolved
3. **Post-Mortem:** Within 5 business days for Severity 1 incidents

**Post-Mortem Includes:**
- Root cause analysis
- Timeline of events
- Remediation steps taken
- Preventative measures for future

## Exclusions from SLA

This SLA does NOT cover downtime caused by:

1. **Customer Actions:**
   - Misconfiguration of services
   - Exceeding rate limits or quotas
   - Invalid API requests
   - Insufficient capacity planning

2. **External Factors:**
   - Internet service provider issues
   - DDoS attacks (unless DDoS protection purchased)
   - Force majeure events (natural disasters, war, etc.)
   - Third-party service failures (DNS providers, etc.)

3. **Scheduled Maintenance:**
   - Announced 7+ days in advance
   - Within designated maintenance windows

4. **Beta/Preview Services:**
   - Services marked as "Beta" or "Preview" have no SLA

5. **Free Tier Usage:**
   - Free tier resources have no SLA

## Data Backup & Recovery

### Backup SLA

**Customer Responsibility:**
- Team Defaulters does NOT automatically backup your data
- You must configure snapshots/backups yourself
- See Nebula Compute and Vortex Storage documentation

**Snapshot Availability:**
- Snapshots stored with same durability as Vortex Storage (11 nines)
- Recovery time: <15 minutes for most instances

**Disaster Recovery:**
- Cross-region replication available (see Vortex Storage docs)
- RPO (Recovery Point Objective): Depends on snapshot frequency
- RTO (Recovery Time Objective): <1 hour for most configurations

## Security Incident Response

### Security SLA

**Incident Response Time:**
- **Critical vulnerabilities:** Patch within 24 hours
- **High vulnerabilities:** Patch within 7 days
- **Medium vulnerabilities:** Patch within 30 days

**Notification:**
- Customers notified within 72 hours of discovering a breach affecting their data
- Notification includes: nature of breach, affected data, remediation steps

**Compliance:**
- Team Defaulters maintains SOC2 Type II, ISO 27001, GDPR compliance
- Annual audits published at: compliance.teamdefaulters.com

## SLA Modifications

Team Defaulters reserves the right to modify this SLA with **90 days' notice**.

**Notification Method:**
- Email to account owner
- Announcement on status page
- In-app notification

**Customer Rights:**
- If SLA changes negatively impact you, you may cancel without penalty within 30 days of notification

## Dispute Resolution

If you disagree with a service credit decision:

1. **Escalate to Support Manager:** support-escalation@teamdefaulters.com
2. **Response:** Within 5 business days
3. **Final Escalation:** VP of Customer Success (enterprise customers only)

**Binding Arbitration:**
- If dispute cannot be resolved, binding arbitration per Master Service Agreement

## Contact Information

**SLA Questions:** sla@teamdefaulters.com  
**Support Portal:** support.teamdefaulters.com  
**Status Page:** status.teamdefaulters.com  
**Emergency Hotline (Enterprise only):** +1 (888) 333-CLOUD

---

**Acknowledgment:**  
By using Team Defaulters services, you acknowledge that you have read, understood, and agree to this Service Level Agreement.

*Last Updated: January 1, 2026*
