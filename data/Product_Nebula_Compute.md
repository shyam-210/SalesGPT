# Nebula Compute - Cloud Computing Platform

## Overview

**Nebula Compute** is Team Defaulters' flagship Infrastructure-as-a-Service (IaaS) offering, providing on-demand virtual machines with industry-leading performance and flexibility.

## Instance Types

### General Purpose Instances (N-Series)

Balanced CPU, memory, and network resources for most workloads.

**N1.small**
- 2 vCPUs
- 4 GB RAM
- 50 GB SSD Storage
- 1 Gbps Network
- **Price:** $0.08/hour ($58/month)

**N1.medium**
- 4 vCPUs
- 8 GB RAM
- 100 GB SSD Storage
- 2 Gbps Network
- **Price:** $0.16/hour ($116/month)

**N1.large**
- 8 vCPUs
- 16 GB RAM
- 200 GB SSD Storage
- 5 Gbps Network
- **Price:** $0.32/hour ($232/month)

**N1.xlarge**
- 16 vCPUs
- 32 GB RAM
- 400 GB SSD Storage
- 10 Gbps Network
- **Price:** $0.64/hour ($464/month)

### Compute-Optimized Instances (C-Series)

High-performance processors for compute-intensive applications.

**C1.large**
- 8 vCPUs (3.5 GHz Intel Xeon)
- 8 GB RAM
- 100 GB NVMe SSD
- 10 Gbps Network
- **Price:** $0.40/hour ($290/month)

**C1.xlarge**
- 16 vCPUs (3.5 GHz Intel Xeon)
- 16 GB RAM
- 200 GB NVMe SSD
- 25 Gbps Network
- **Price:** $0.80/hour ($580/month)

### Memory-Optimized Instances (M-Series)

Large memory footprint for databases and in-memory caching.

**M1.large**
- 4 vCPUs
- 32 GB RAM
- 200 GB SSD Storage
- 5 Gbps Network
- **Price:** $0.50/hour ($362/month)

**M1.xlarge**
- 8 vCPUs
- 64 GB RAM
- 400 GB SSD Storage
- 10 Gbps Network
- **Price:** $1.00/hour ($725/month)

**M1.2xlarge**
- 16 vCPUs
- 128 GB RAM
- 800 GB SSD Storage
- 25 Gbps Network
- **Price:** $2.00/hour ($1,450/month)

### GPU Instances (G-Series)

NVIDIA GPUs for AI/ML workloads and graphics rendering.

**G1.small**
- 8 vCPUs
- 32 GB RAM
- 1x NVIDIA T4 (16 GB VRAM)
- 500 GB SSD Storage
- **Price:** $1.50/hour ($1,087/month)

**G1.large**
- 16 vCPUs
- 64 GB RAM
- 2x NVIDIA A100 (80 GB VRAM each)
- 1 TB NVMe SSD Storage
- **Price:** $5.00/hour ($3,625/month)

**G1.xlarge**
- 32 vCPUs
- 128 GB RAM
- 4x NVIDIA H100 (80 GB VRAM each)
- 2 TB NVMe SSD Storage
- **Price:** $12.00/hour ($8,700/month)

## Autoscaling Features

### Horizontal Autoscaling

Automatically add or remove instances based on demand.

**Configuration Options:**
- **Min Instances:** 1-100
- **Max Instances:** 1-1000
- **Scale-Up Trigger:** CPU > 70% for 5 minutes
- **Scale-Down Trigger:** CPU < 30% for 10 minutes
- **Cooldown Period:** 5 minutes between scaling events

**Pricing:** No additional charge for autoscaling. You only pay for running instances.

### Vertical Autoscaling

Automatically resize instance types based on workload patterns.

**Example:** Your N1.medium can automatically upgrade to N1.large during peak hours and downgrade during off-peak.

**Requirements:**
- Must enable "Flexible Instance Sizing" in console
- Requires a brief restart (typically 30-60 seconds)
- Available on all N-Series and C-Series instances

## Load Balancing

### Application Load Balancer (ALB)

Layer 7 load balancing with SSL termination and path-based routing.

**Features:**
- HTTP/HTTPS support
- WebSocket support
- Health checks every 30 seconds
- Automatic failover in <10 seconds
- SSL certificate management included

**Pricing:** $0.025/hour + $0.008 per GB processed

### Network Load Balancer (NLB)

Layer 4 load balancing for ultra-low latency requirements.

**Features:**
- TCP/UDP support
- Static IP addresses
- Preserves source IP
- Handles millions of requests per second

**Pricing:** $0.025/hour + $0.006 per GB processed

## Operating Systems

### Included at No Extra Cost:
- Ubuntu 20.04, 22.04, 24.04 LTS
- Debian 11, 12
- CentOS Stream 8, 9
- Rocky Linux 8, 9
- Fedora 38, 39

### Licensed OS (Additional Cost):
- **Windows Server 2019:** +$0.05/hour
- **Windows Server 2022:** +$0.06/hour
- **Red Hat Enterprise Linux 8/9:** +$0.04/hour

## Snapshots & Backups

### Manual Snapshots
- Create point-in-time snapshots of your instances
- **Storage Cost:** $0.05 per GB/month
- Restore to new instance in <5 minutes

### Automated Backups
- Daily, weekly, or monthly schedules
- Retention: 7, 14, 30, or 90 days
- **Pricing:** Same as manual snapshots ($0.05/GB/month)

## Reserved Instances

Save up to 60% by committing to 1 or 3-year terms.

**1-Year Commitment:**
- 30% discount on hourly rate
- Payment: All upfront, partial upfront, or monthly

**3-Year Commitment:**
- 60% discount on hourly rate
- Payment: All upfront, partial upfront, or monthly

**Example:**  
N1.large normally costs $232/month.  
With 3-year reserved pricing: $93/month (60% savings).

## Networking

### Public IP Addresses
- **IPv4:** $3/month per static IP
- **IPv6:** Free (unlimited)

### Private Networking
- Free VPC (Virtual Private Cloud) for all customers
- Subnet isolation
- Security groups with stateful firewall rules
- VPN gateway support

### Data Transfer Pricing
- **Inbound:** Free
- **Outbound (First 10 TB/month):** $0.09/GB
- **Outbound (Next 40 TB/month):** $0.07/GB
- **Outbound (Over 50 TB/month):** $0.05/GB
- **Between Regions:** $0.02/GB

## API & Automation

### Nebula CLI
Command-line interface for managing instances.

```bash
# Launch an instance
nebula compute create --type N1.large --os ubuntu-22.04 --region us-west

# List instances
nebula compute list

# Start autoscaling group
nebula autoscale create --min 2 --max 10 --target-cpu 70
```

### REST API
Full programmatic control with our RESTful API.

**Authentication:** API keys or OAuth 2.0  
**Rate Limits:** 1,000 requests/minute (Enterprise: 10,000/min)

### Terraform Provider
Official Terraform provider for infrastructure-as-code.

```hcl
resource "nebula_instance" "web_server" {
  instance_type = "N1.large"
  os_image      = "ubuntu-22.04"
  region        = "us-west"
}
```

## Support & SLA

- **Uptime SLA:** 99.99% (see Service Level Agreement document)
- **Support Channels:** Email, chat, phone (tier-dependent)
- **Documentation:** docs.teamdefaulters.com/nebula

## Getting Started

1. **Sign up** at console.teamdefaulters.com
2. **Create your first instance** via web console or CLI
3. **Connect via SSH** (Linux) or RDP (Windows)
4. **Deploy your application**

For detailed tutorials, visit: docs.teamdefaulters.com/nebula/quickstart
