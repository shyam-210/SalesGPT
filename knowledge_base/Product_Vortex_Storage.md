# Vortex Storage - Object Storage Platform

## Overview

**Vortex Storage** is Team Defaulters' S3-compatible object storage service, designed for storing and retrieving any amount of data from anywhere on the web. With 11 nines of durability (99.999999999%), your data is safer with us than in a physical vault.

## Storage Classes

### Vortex Standard

High-performance storage for frequently accessed data.

**Features:**
- **Durability:** 99.999999999% (11 nines)
- **Availability:** 99.99%
- **Latency:** <10ms first-byte retrieval
- **Redundancy:** Data replicated across 3+ availability zones

**Pricing:**
- **Storage:** $0.023 per GB/month
- **PUT/POST Requests:** $0.005 per 1,000 requests
- **GET Requests:** $0.0004 per 1,000 requests
- **Data Transfer Out:** $0.09/GB (first 10 TB)

**Use Cases:**
- Website hosting
- Mobile app assets
- Real-time analytics
- Content distribution

### Vortex Infrequent Access (IA)

Cost-optimized storage for data accessed less than once per month.

**Features:**
- **Durability:** 99.999999999% (11 nines)
- **Availability:** 99.9%
- **Latency:** <10ms first-byte retrieval
- **Minimum Storage Duration:** 30 days

**Pricing:**
- **Storage:** $0.0125 per GB/month (46% cheaper than Standard)
- **PUT/POST Requests:** $0.01 per 1,000 requests
- **GET Requests:** $0.001 per 1,000 requests
- **Retrieval Fee:** $0.01 per GB retrieved
- **Data Transfer Out:** $0.09/GB (first 10 TB)

**Use Cases:**
- Backups
- Disaster recovery
- Long-term archives
- Compliance data

### Vortex Glacier

Ultra-low-cost archival storage for data accessed rarely (once per year or less).

**Features:**
- **Durability:** 99.999999999% (11 nines)
- **Availability:** 99.99% (after retrieval)
- **Retrieval Time:** 3-5 hours (Standard), 1-5 minutes (Expedited)
- **Minimum Storage Duration:** 90 days

**Pricing:**
- **Storage:** $0.004 per GB/month (83% cheaper than Standard)
- **PUT/POST Requests:** $0.05 per 1,000 requests
- **Standard Retrieval:** $0.01 per GB + $0.05 per 1,000 requests
- **Expedited Retrieval:** $0.03 per GB + $0.10 per 1,000 requests
- **Data Transfer Out:** $0.09/GB (first 10 TB)

**Use Cases:**
- Regulatory archives (7-10 year retention)
- Media archives
- Scientific data preservation
- Legal document storage

### Vortex Intelligent-Tiering

Automatically moves data between storage classes based on access patterns.

**How It Works:**
- Monitors access patterns for each object
- Moves objects not accessed for 30 days to IA tier
- Moves objects not accessed for 90 days to Glacier tier
- Automatically promotes objects back to Standard when accessed

**Pricing:**
- **Storage:** Same as the tier the object currently resides in
- **Monitoring Fee:** $0.0025 per 1,000 objects/month
- **No retrieval fees** when objects are promoted

**Use Cases:**
- Unknown or changing access patterns
- Data lakes
- Machine learning datasets

## Data Transfer Pricing

### Outbound Data Transfer (Internet)

| Volume | Price per GB |
|--------|--------------|
| First 10 TB/month | $0.09 |
| Next 40 TB/month | $0.07 |
| Next 100 TB/month | $0.05 |
| Over 150 TB/month | $0.03 |

### Inbound Data Transfer
**Free** - No charge for uploading data to Vortex.

### Cross-Region Transfer
**$0.02 per GB** - Transfer data between different Team Defaulters regions.

### Same-Region Transfer
**Free** - Transfer between Vortex and Nebula Compute in the same region.

## Redundancy Tiers

### Standard Redundancy (Default)

Data is automatically replicated across **3 availability zones** within a region.

- **Durability:** 99.999999999%
- **Can survive:** Loss of 2 entire data centers
- **No additional cost**

### Cross-Region Replication (CRR)

Automatically replicate objects to a secondary region for disaster recovery.

**Configuration:**
- Choose destination region (e.g., us-west → eu-central)
- Replicate all objects or filter by prefix/tags
- Replication time: Typically <15 minutes

**Pricing:**
- **Replication Fee:** $0.01 per GB replicated
- **Storage in destination region:** Standard storage rates apply
- **Cross-region transfer:** $0.02/GB

**Use Cases:**
- Disaster recovery
- Compliance (data residency requirements)
- Low-latency access from multiple geographies

### Single-Zone Storage (Economy)

Store data in a single availability zone for non-critical workloads.

**Features:**
- **Durability:** 99.999999% (8 nines) - lower than standard
- **Cost Savings:** 20% cheaper than Standard
- **Risk:** Data loss if the entire zone fails (rare but possible)

**Pricing:**
- **Storage:** $0.018 per GB/month

**Use Cases:**
- Temporary data
- Easily reproducible data
- Development/testing environments

## Features

### Versioning

Keep multiple versions of an object to protect against accidental deletion.

**How It Works:**
- Enable versioning on a bucket
- Every PUT creates a new version
- DELETE operations create a delete marker (object can be restored)
- Old versions can be permanently deleted to save storage

**Pricing:** Each version is billed as a separate object.

### Lifecycle Policies

Automate data management with lifecycle rules.

**Example Rules:**
- Transition objects to IA after 30 days
- Transition objects to Glacier after 90 days
- Permanently delete objects after 365 days
- Delete incomplete multipart uploads after 7 days

**Configuration:**
```json
{
  "rules": [
    {
      "id": "archive-old-logs",
      "prefix": "logs/",
      "transitions": [
        {"days": 30, "storage_class": "IA"},
        {"days": 90, "storage_class": "GLACIER"}
      ],
      "expiration": {"days": 365}
    }
  ]
}
```

### Object Lock (WORM)

Write-Once-Read-Many compliance mode for regulatory requirements.

**Modes:**
- **Governance Mode:** Protect objects from deletion (admins can override)
- **Compliance Mode:** No one can delete objects until retention period expires

**Use Cases:**
- SEC 17a-4 compliance (financial records)
- HIPAA compliance (healthcare records)
- Legal holds

**Pricing:** No additional cost.

### Encryption

#### Server-Side Encryption (SSE)

**SSE-Vortex (Default):**
- Encryption managed by Team Defaulters
- AES-256 encryption
- No additional cost

**SSE-KMS:**
- Use your own encryption keys via Key Management Service
- Audit trail of key usage
- Additional cost: $0.03 per 10,000 requests

**SSE-C (Customer-Provided Keys):**
- You manage encryption keys
- Team Defaulters never stores your keys
- No additional cost

#### Client-Side Encryption
Encrypt data before uploading using Vortex SDK.

### Access Control

#### Bucket Policies
JSON-based policies for fine-grained access control.

```json
{
  "Version": "2026-01-01",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "vortex:GetObject",
      "Resource": "vortex://my-bucket/public/*"
    }
  ]
}
```

#### Access Control Lists (ACLs)
Legacy method for granting read/write permissions.

#### Pre-Signed URLs
Generate temporary URLs for secure, time-limited access.

**Example:**
```bash
vortex presign vortex://my-bucket/private-file.pdf --expires 3600
# Returns: https://vortex.teamdefaulters.com/my-bucket/private-file.pdf?signature=...
```

## Performance Optimization

### Multipart Upload

Upload large files (>100 MB) in parallel chunks.

**Benefits:**
- Faster uploads (parallel processing)
- Resume failed uploads
- Upload files up to 5 TB

**Recommended:** Use for files >100 MB.

### Transfer Acceleration

Use CloudFront edge locations to speed up uploads.

**How It Works:**
- Upload to nearest edge location
- Data routed to Vortex over optimized AWS backbone
- Typical speedup: 50-500% faster

**Pricing:** +$0.04 per GB uploaded via acceleration.

### Request Rate Performance

- **Standard:** 3,500 PUT/POST/DELETE and 5,500 GET requests per second per prefix
- **High Performance Mode:** 100,000+ requests/second (contact sales)

## S3 Compatibility

Vortex is 100% compatible with Amazon S3 API.

**Supported Tools:**
- AWS CLI (just change endpoint)
- s3cmd
- Cyberduck
- CloudBerry Backup
- Any S3-compatible application

**Example (AWS CLI):**
```bash
aws s3 cp myfile.txt s3://my-bucket/ --endpoint-url https://vortex.teamdefaulters.com
```

## Monitoring & Analytics

### Storage Analytics

- **Storage Class Analysis:** See which objects should be moved to IA/Glacier
- **Access Patterns:** Identify hot and cold data
- **Cost Optimization Recommendations**

**Pricing:** Included free.

### Access Logs

Log all requests to a bucket for security auditing.

**Log Format:** JSON or CSV  
**Delivery:** Every 15 minutes to a destination bucket  
**Pricing:** Storage costs for logs only.

### Metrics & Alerts

- Real-time metrics in Team Defaulters Console
- CloudWatch-compatible metrics API
- Set alerts for storage thresholds, request rates, errors

## Use Case Examples

### Static Website Hosting

Host a static website directly from Vortex.

**Features:**
- Custom domain support
- HTTPS via free SSL certificates
- Automatic index.html routing
- Custom error pages

**Pricing:** Standard storage + data transfer rates.

### Content Delivery

Integrate with Team Defaulters CDN for global content delivery.

**Benefits:**
- Cache objects at 200+ edge locations
- Reduce latency by 80%+
- Reduce Vortex data transfer costs

### Data Lake

Store petabytes of structured and unstructured data.

**Features:**
- Query data in-place with Vortex Select (SQL queries)
- Integrate with Spark, Hadoop, Presto
- No data movement required

**Vortex Select Pricing:** $0.002 per GB scanned.

## Getting Started

### 1. Create a Bucket

```bash
vortex mb vortex://my-first-bucket --region us-west
```

### 2. Upload a File

```bash
vortex cp myfile.txt vortex://my-first-bucket/
```

### 3. Download a File

```bash
vortex cp vortex://my-first-bucket/myfile.txt ./downloaded.txt
```

### 4. List Objects

```bash
vortex ls vortex://my-first-bucket/
```

## Support & Documentation

- **Documentation:** docs.teamdefaulters.com/vortex
- **API Reference:** docs.teamdefaulters.com/vortex/api
- **SDK Downloads:** github.com/teamdefaulters/vortex-sdk

For pricing calculator: console.teamdefaulters.com/pricing/vortex
