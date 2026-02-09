# Team Defaulters - Security & Compliance

## Overview

Security is not an afterthought at Team Defaulters—it's foundational to everything we build. Our infrastructure is designed with defense-in-depth principles, ensuring your data remains protected against evolving threats.

## Compliance Certifications

### SOC 2 Type II

**Status:** Certified (Annual Audit)  
**Auditor:** Deloitte & Touche LLP  
**Last Audit:** December 2025  
**Next Audit:** December 2026

**Scope:**
- Security
- Availability
- Confidentiality
- Processing Integrity

**Report Access:**
- Available to Enterprise customers under NDA
- Request at: compliance@teamdefaulters.com

### ISO 27001:2022

**Status:** Certified  
**Certification Body:** BSI Group  
**Certificate Number:** IS 789456  
**Valid Until:** March 2027

**Scope:**
- Information Security Management System (ISMS)
- All data centers and cloud services
- Corporate IT infrastructure

### GDPR Compliance

**Status:** Fully Compliant  
**DPO (Data Protection Officer):** privacy@teamdefaulters.com

**GDPR Features:**
- Data Processing Agreements (DPA) available
- Right to erasure (delete customer data within 30 days)
- Data portability (export data in JSON/CSV format)
- Data residency controls (choose EU-only regions)
- Breach notification within 72 hours

**EU Representative:**  
Team Defaulters EU Ltd.  
Frankfurt, Germany  
eu-privacy@teamdefaulters.com

### HIPAA Compliance

**Status:** HIPAA-Ready Infrastructure  
**BAA (Business Associate Agreement):** Available for Enterprise customers

**HIPAA Features:**
- Encrypted storage (AES-256)
- Encrypted transit (TLS 1.3)
- Audit logging (all data access logged)
- Access controls (role-based permissions)
- Automatic session timeouts

**Important:**
- HIPAA compliance requires Enterprise tier
- Customer must sign BAA before storing PHI
- Additional security controls must be enabled
- Annual compliance review required

**Request BAA:** hipaa@teamdefaulters.com

### PCI DSS Level 1

**Status:** Certified Service Provider  
**QSA (Qualified Security Assessor):** Trustwave  
**Attestation of Compliance (AOC):** Available on request

**Scope:**
- Payment processing infrastructure
- Cardholder data environment (CDE)
- Network security controls

**Note:** Customers processing credit cards must still achieve their own PCI compliance. Team Defaulters provides a compliant infrastructure foundation.

### Other Certifications

- **ISO 9001:2015** (Quality Management)
- **ISO 14001:2015** (Environmental Management)
- **CSA STAR Level 2** (Cloud Security Alliance)
- **FedRAMP Moderate** (In Progress - Expected Q3 2026)

## Data Security

### Encryption

#### Data at Rest

**Default Encryption:**
- All data encrypted by default (no opt-in required)
- AES-256 encryption algorithm
- FIPS 140-2 validated encryption modules

**Key Management:**
- **Team Defaulters Managed Keys (Default):**
  - Keys managed by Team Defaulters Key Management Service
  - Automatic key rotation every 90 days
  - Keys stored in hardware security modules (HSMs)

- **Customer Managed Keys (CMK):**
  - Bring your own encryption keys
  - Full control over key lifecycle
  - Audit trail of all key usage
  - Available on Enterprise tier

- **Customer Provided Keys (CPK):**
  - You manage keys entirely (Team Defaulters never stores them)
  - You provide key with each request
  - Maximum security, maximum responsibility

#### Data in Transit

**All network traffic encrypted:**
- TLS 1.3 (minimum TLS 1.2)
- Perfect Forward Secrecy (PFS)
- Strong cipher suites only (no weak ciphers)

**VPN Options:**
- IPsec VPN tunnels
- OpenVPN
- WireGuard (beta)

### Network Security

#### DDoS Protection

**Included (All Tiers):**
- Layer 3/4 DDoS mitigation
- Up to 10 Gbps attack mitigation
- Automatic detection and mitigation

**Advanced DDoS Protection (Add-on):**
- Layer 7 (application-layer) protection
- Up to 100 Gbps attack mitigation
- 24/7 DDoS response team
- **Cost:** $3,000/month

#### Firewall & Security Groups

**Stateful Firewall:**
- Default deny-all policy
- Granular ingress/egress rules
- Support for IP whitelisting/blacklisting

**Web Application Firewall (WAF):**
- OWASP Top 10 protection
- SQL injection prevention
- XSS (Cross-Site Scripting) prevention
- Rate limiting
- **Cost:** $50/month + $0.01 per 10,000 requests

#### Intrusion Detection/Prevention

**IDS/IPS (Enterprise Only):**
- Real-time threat detection
- Automatic blocking of malicious IPs
- Integration with threat intelligence feeds
- Alerts via email, Slack, PagerDuty

**Cost:** Included with Enterprise tier

### Identity & Access Management (IAM)

#### User Authentication

**Multi-Factor Authentication (MFA):**
- TOTP (Google Authenticator, Authy)
- SMS-based (not recommended for high security)
- Hardware tokens (YubiKey, etc.)
- **Requirement:** Mandatory for Enterprise tier

**Single Sign-On (SSO):**
- SAML 2.0 support
- OAuth 2.0 / OpenID Connect
- Integrations: Okta, Azure AD, Google Workspace, OneLogin
- **Availability:** Professional and Enterprise tiers

#### Role-Based Access Control (RBAC)

**Built-in Roles:**
- **Owner:** Full access (billing, user management, resources)
- **Admin:** Full resource access (no billing access)
- **Developer:** Read/write access to resources
- **Viewer:** Read-only access
- **Billing Admin:** Billing and payment access only

**Custom Roles (Enterprise):**
- Define granular permissions
- Assign to users or groups
- Audit trail of permission changes

#### API Key Management

**Best Practices:**
- Rotate API keys every 90 days (automated reminders)
- Scope keys to specific services
- IP whitelisting for API keys
- Automatic key expiration

**Key Rotation:**
- Zero-downtime key rotation
- Overlap period for smooth transition

### Audit Logging

#### Activity Logs

**What's Logged:**
- All API calls (who, what, when, from where)
- Console logins
- Resource creation/modification/deletion
- Permission changes
- Failed authentication attempts

**Retention:**
- **Starter:** 30 days
- **Professional:** 90 days
- **Enterprise:** 1 year (customizable up to 7 years)

**Export Options:**
- JSON, CSV formats
- Stream to SIEM (Splunk, Datadog, etc.)
- S3-compatible storage

#### Compliance Logs

**Immutable Logs (Enterprise):**
- Write-once, read-many (WORM) storage
- Tamper-proof audit trail
- Required for SOC2, HIPAA, PCI compliance

**Cost:** $0.10 per GB/month

### Vulnerability Management

#### Security Scanning

**Infrastructure Scanning:**
- Weekly vulnerability scans of all infrastructure
- Automated patching of critical vulnerabilities within 24 hours
- Zero-day threat monitoring

**Customer Responsibilities:**
- Scanning OS and applications inside your instances
- Applying OS patches (we notify, you apply)

**Recommended Tools:**
- Qualys
- Tenable Nessus
- AWS Inspector-compatible API

#### Penetration Testing

**Team Defaulters Internal:**
- Quarterly penetration tests by third-party firms
- Annual red team exercises

**Customer Penetration Testing:**
- Allowed with prior approval
- Submit request: security@teamdefaulters.com
- Approval within 48 hours (typically)
- Must provide test scope and timeframe

**Prohibited:**
- Social engineering attacks on Team Defaulters employees
- Physical security testing
- DDoS attacks

### Incident Response

#### Security Incident Response Team (SIRT)

**24/7 Monitoring:**
- Security Operations Center (SOC)
- Real-time threat detection
- Automated incident response

**Response Times:**
- **Critical Incidents:** <15 minutes
- **High Severity:** <1 hour
- **Medium Severity:** <4 hours

#### Breach Notification

**Customer Notification:**
- Within 72 hours of confirmed breach
- Email to account owner + security contact
- Detailed incident report within 7 days

**Regulatory Notification:**
- Team Defaulters handles notification to regulators (GDPR, HIPAA, etc.)
- Customer responsible for notifying end users (if applicable)

**Post-Incident:**
- Root cause analysis
- Remediation plan
- Preventative measures

## Data Privacy

### Data Residency

**Regional Data Storage:**
- Choose where your data is stored (US, EU, APAC)
- Data never leaves chosen region (unless you enable cross-region replication)
- Metadata may be stored in US (for billing, support tickets)

**EU Data Residency (GDPR):**
- Store all data in Frankfurt or Amsterdam
- EU-only support staff access
- No US government access (under CLOUD Act protections)

### Data Retention & Deletion

**Active Data:**
- Stored as long as you maintain an active account

**Deleted Data:**
- **Soft Delete:** 30-day grace period (recoverable)
- **Hard Delete:** After 30 days, data is permanently deleted
- **Deletion Method:** Cryptographic erasure (encryption keys destroyed)

**Account Closure:**
- All data deleted within 30 days of account closure
- Backups/snapshots deleted within 90 days
- Audit logs retained for 1 year (compliance requirement)

### Data Portability

**Export Your Data:**
- Download all data via API or console
- Formats: JSON, CSV, SQL dumps
- No export fees

**Bulk Transfer:**
- For large datasets (>10 TB), we can ship hard drives
- **Cost:** $500 per 10 TB drive + shipping

## Physical Security

### Data Center Security

**Tier III+ Facilities:**
- 24/7 armed security guards
- Biometric access controls (fingerprint + retina scan)
- Man-trap entry portals
- Video surveillance (90-day retention)
- Seismic and flood protection

**Access Control:**
- Background-checked personnel only
- Two-person rule for sensitive areas
- Visitor logs and escort requirements

**Environmental Controls:**
- Redundant HVAC systems
- Fire suppression (clean agent, no water)
- Backup generators (N+1 redundancy)
- UPS systems (15-minute battery backup)

### Hardware Disposal

**Decommissioning Process:**
1. Data wiped using DoD 5220.22-M standard (7-pass wipe)
2. Drives physically destroyed (shredded)
3. Certificate of destruction provided
4. Recycling through certified e-waste partners

## Employee Security

### Background Checks

**All Employees:**
- Criminal background check
- Employment verification
- Education verification

**Privileged Access Employees:**
- Enhanced background check
- Credit check
- Reference checks

### Security Training

**Mandatory Training:**
- Security awareness training (annual)
- GDPR/HIPAA training (for relevant teams)
- Phishing simulations (quarterly)

**Privileged Access Training:**
- Advanced security training
- Incident response drills
- Social engineering awareness

### Access Controls

**Principle of Least Privilege:**
- Employees have minimum access needed for their role
- Access reviewed quarterly
- Automatic access revocation upon termination

**Production Access:**
- Requires VP approval
- Time-limited access (4-hour sessions)
- All actions logged and auditable

## Third-Party Security

### Vendor Management

**Vendor Risk Assessment:**
- Security questionnaires for all vendors
- Annual security reviews
- SOC2 reports required for critical vendors

**Data Processors:**
- All subprocessors listed at: subprocessors.teamdefaulters.com
- 30-day notice before adding new subprocessors
- Customers can object to new subprocessors

### Supply Chain Security

**Hardware Vendors:**
- Trusted suppliers only (Dell, HPE, Cisco)
- Tamper-evident packaging
- Firmware integrity verification

**Software Dependencies:**
- Automated vulnerability scanning
- Dependency update policy (critical patches within 48 hours)

## Security Resources

### Security Documentation

**Security Portal:** security.teamdefaulters.com

**Resources:**
- Security whitepaper
- Compliance documentation
- Security best practices guide
- Incident response playbook

### Responsible Disclosure

**Bug Bounty Program:**
- Rewards up to $10,000 for critical vulnerabilities
- Managed via HackerOne: hackerone.com/teamdefaulters

**Report Security Issues:**
- Email: security@teamdefaulters.com
- PGP Key: Available at security.teamdefaulters.com/pgp
- Response time: <24 hours

### Security Contacts

**General Security Questions:** security@teamdefaulters.com  
**GDPR/Privacy Questions:** privacy@teamdefaulters.com  
**HIPAA/BAA Requests:** hipaa@teamdefaulters.com  
**Compliance Reports:** compliance@teamdefaulters.com  
**Security Incidents:** incidents@teamdefaulters.com (24/7)

---

*Last Updated: January 1, 2026*  
*For the latest security updates, visit: security.teamdefaulters.com*
