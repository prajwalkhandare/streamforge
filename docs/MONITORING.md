<div align="center">

# 📊 Monitoring & 🔒 Security

### Full-stack observability meets defense-in-depth security — production-grade, out of the box.

[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboards-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)
[![ELK Stack](https://img.shields.io/badge/ELK-Centralized%20Logs-005571?style=for-the-badge&logo=elasticstack&logoColor=white)](https://www.elastic.co/what-is/elk-stack)
[![Vault](https://img.shields.io/badge/HashiCorp%20Vault-Secrets-FFCA28?style=for-the-badge&logo=vault&logoColor=black)](https://www.vaultproject.io/)
[![Trivy](https://img.shields.io/badge/Trivy-Container%20Scan-1904DA?style=for-the-badge&logo=aquasecurity&logoColor=white)](https://trivy.dev/)
[![OPA](https://img.shields.io/badge/OPA-Policy%20Engine-7C3AED?style=for-the-badge&logo=openpolicyagent&logoColor=white)](https://www.openpolicyagent.org/)

</div>

---

## 📋 Table of Contents

- [📊 Monitoring Stack](#-monitoring-stack)
  - [Architecture](#️-architecture)
  - [Prometheus](#-prometheus)
  - [Grafana Dashboards](#-grafana-dashboards)
  - [ELK Stack (Logging)](#-elk-stack--logging)
  - [SLO / SLI Definitions](#-slosli-definitions)
  - [Alert Rules](#-alert-rules)
  - [Running Locally](#-running-monitoring-locally)
- [🔒 Security Guide](#-security-guide)
  - [Defense Layers](#️-defense-in-depth-layers)
  - [Network Security](#-network-security)
  - [Container Security](#-container-security)
  - [Kubernetes Security](#️-kubernetes-security)
  - [Application Security](#-application-security)
  - [Secrets Management](#-secrets-management)
  - [Encryption](#-encryption)
  - [Compliance](#-compliance)
  - [Incident Response](#-incident-response)

---

# 📊 Monitoring Stack

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  🖥️  APPLICATIONS                                                │
│  Backend · Frontend · PostgreSQL · Redis · Nginx                 │
└───────────────────────────────┬──────────────────────────────────┘
                                │  metrics
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  🔥  PROMETHEUS                                                   │
│  Metrics Collection · Time Series DB · Alert Rules               │
└──────────────┬────────────────┬──────────────────────────────────┘
               │                │                    │
               ▼                ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  📈  GRAFANA    │  │  🔔 ALERTMANAGER  │  │  ☁️  CLOUDWATCH     │
│  Dashboards &   │  │  Slack / Email /  │  │  AWS Infrastructure │
│  Visualizations │  │  PagerDuty        │  │  Metrics            │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## 🔥 Prometheus

### Scrape Configuration

```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod

  - job_name: 'streamforge-backend'
    static_configs:
      - targets: ['streamforge-backend:5000']
```

### Key Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `container_cpu_usage_seconds_total` | CPU usage per pod | 🔴 > 80% |
| `container_memory_working_set_bytes` | Memory usage per pod | 🔴 > 2 GB |
| `http_requests_total` | Total API requests | — |
| `http_request_duration_seconds` | Request latency | 🟡 p95 < 500ms |
| `pg_stat_database_numbackends` | DB connections | 🔴 > 50 |

---

## 📈 Grafana Dashboards

<details>
<summary><strong>🖥️ Kubernetes Cluster</strong></summary>

| Panel | Description |
|-------|-------------|
| CPU Usage | Pod CPU utilization |
| Memory Usage | Pod memory consumption |
| Network I/O | Ingress / Egress traffic |
| Node Status | Ready nodes count |

</details>

<details>
<summary><strong>⚙️ API Metrics</strong></summary>

| Panel | Description |
|-------|-------------|
| Request Rate | Requests per second |
| Duration (P95) | 95th percentile latency |
| Error Rate | 5xx error percentage |
| Active Connections | Current connections |

</details>

<details>
<summary><strong>🗄️ Database</strong></summary>

| Panel | Description |
|-------|-------------|
| Connections | Active DB connections |
| Query Throughput | Queries per second |
| CPU Utilization | RDS CPU % |
| Free Storage | Available storage |

</details>

---

## 📋 ELK Stack — Logging

### Log Sources & Retention

| Source | Log Type | Retention |
|--------|----------|-----------|
| 🟢 Backend API | Application logs | 30 days |
| 🔵 Frontend | Browser console | 7 days |
| ☸️ Kubernetes Pods | Container logs | 15 days |
| 🗄️ PostgreSQL | Database logs | 30 days |
| 🌐 Nginx | Access / Error logs | 7 days |

### Structured Log Format

```json
{
  "timestamp":  "2024-01-15T10:30:00Z",
  "level":      "info",
  "service":    "streamforge-backend",
  "message":    "User logged in",
  "user_id":    "uuid",
  "request_id": "req-123",
  "trace_id":   "trace-456"
}
```

---

## 🎯 SLO/SLI Definitions

### Service Level Indicators (SLIs)

| SLI | Target | Current | Status |
|-----|--------|---------|--------|
| 🟢 Availability | 99.9% | 99.95% | ✅ |
| ⚡ Latency (p95) | < 500ms | 145ms | ✅ |
| 🛡️ Error Rate | < 0.1% | 0.03% | ✅ |
| 🚀 Throughput | 1000 req/s | 850 req/s | ✅ |

### Service Level Objectives (SLOs)

| SLO | Target | Error Budget |
|-----|--------|-------------|
| API Availability | 99.9% | 43 min / month |
| API Latency | < 500ms | 95% of requests |
| Error Rate | < 0.1% | 0.1% of requests |

---

## 🔔 Alert Rules

<details>
<summary><strong>🔴 Critical Alerts (PagerDuty)</strong></summary>

```yaml
- alert: HighCPUUsage
  expr: sum(rate(container_cpu_usage_seconds_total[5m])) > 0.8
  for: 5m
  severity: critical
  message: "CPU usage > 80% for 5 minutes"

- alert: HighMemoryUsage
  expr: container_memory_working_set_bytes > 2e9
  for: 5m
  severity: critical
  message: "Memory usage > 2GB"

- alert: PodDown
  expr: kube_pod_status_phase{phase="Running"} < 1
  for: 2m
  severity: critical
  message: "Pod {{ $labels.pod }} is not running"

- alert: APIHighLatency
  expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m]))) > 1
  for: 5m
  severity: warning
  message: "API latency > 1s"
```

</details>

---

## 💻 Running Monitoring Locally

```bash
# Start Prometheus
docker run -d -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Start Grafana
docker run -d -p 3000:3000 grafana/grafana

# Start ELK Stack
docker-compose -f monitoring/elk/docker-compose.yml up -d
```

### Useful Commands

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query a metric
curl 'http://localhost:9090/api/v1/query?query=up'

# Get Grafana admin password
kubectl get secret -n monitoring grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# View pod logs
kubectl logs -n streamforge -l app=backend

# Stream logs to Elasticsearch
kubectl logs -n streamforge -l app=backend --tail=100 | nc elasticsearch 9200
```

### Troubleshooting

<details>
<summary><strong>🔴 Prometheus not scraping targets</strong></summary>

```bash
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
curl http://localhost:9090/api/v1/targets
```

</details>

<details>
<summary><strong>🔴 Grafana showing no data</strong></summary>

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
# Then login and verify Prometheus datasource is configured correctly
```

</details>

<details>
<summary><strong>🔴 No logs appearing in Kibana</strong></summary>

```bash
# Check Filebeat
kubectl logs -n monitoring -l app=filebeat

# Check Elasticsearch indices
kubectl port-forward -n monitoring svc/elasticsearch-master 9200:9200
curl http://localhost:9200/_cat/indices
```

</details>

---

---

# 🔒 Security Guide

## 🛡️ Defense-in-Depth Layers

| Layer | Controls |
|-------|----------|
| 🌐 **Network** | VPC isolation, Security Groups, Network Policies |
| 🧩 **Application** | OWASP Top 10, Input validation, Rate limiting |
| 🐳 **Container** | Image scanning, Non-root users, Read-only filesystem |
| ☸️ **Kubernetes** | RBAC, Pod Security Standards, OPA policies |
| 🔑 **Secrets** | HashiCorp Vault, AWS Secrets Manager |
| 📋 **Compliance** | PCI-DSS · SOC2 · ISO 27001 |

---

## 🌐 Network Security

### VPC Configuration

- 🔒 **Private subnets** for all application workloads
- 🌍 **Public subnets** for load balancers only
- 🔁 **NAT Gateway** for outbound internet access
- 📋 **VPC Flow Logs** enabled for full audit trail

### Security Groups

```yaml
# EKS Cluster
Ingress:  Port 443  → Allow from VPC CIDR
Egress:   All ports → Allow

# RDS PostgreSQL
Ingress:  Port 5432 → Allow from EKS node groups only
Egress:   Deny all

# ElastiCache Redis
Ingress:  Port 6379 → Allow from backend pods only
Egress:   Deny all
```

### Kubernetes Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 5000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgresql
      ports:
        - port: 5432
```

---

## 🐳 Container Security

### Image Scanning (Trivy)

```bash
trivy image streamforge-backend:latest \
  --severity HIGH,CRITICAL \
  --exit-code 1   # Fail build on critical CVEs
```

### Dockerfile Best Practices

```dockerfile
# ✅ Pin specific versions — never use :latest
FROM node:20-alpine

# ✅ Create and use a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --chown=nodejs:nodejs . .
USER nodejs

# ✅ Read-only filesystem
RUN chmod -R 555 /app

# ✅ Always define a health check
HEALTHCHECK --interval=30s CMD node health.js
```

### Pod Security Context

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: [ALL]
```

---

## ☸️ Kubernetes Security

### RBAC Configuration

```yaml
# Least-privilege service account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
rules:
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "list"]       # Read-only — no write access
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-binding
subjects:
  - kind: ServiceAccount
    name: backend-sa
roleRef:
  kind: Role
  name: backend-role
```

### OPA Policy Gates

```rego
# ❌ Block :latest image tags
deny[msg] {
    container := input.request.object.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg = "Using 'latest' tag is not allowed"
}

# ❌ Require resource limits on all containers
deny[msg] {
    container := input.request.object.spec.template.spec.containers[_]
    not container.resources.limits
    msg = "Resource limits are required"
}
```

### CIS Benchmark Compliance

```bash
# Run kube-bench to verify CIS compliance
docker run --rm \
  -v /etc/kubernetes:/etc/kubernetes \
  aquasec/kube-bench:latest
```

---

## 🔑 Secrets Management

### HashiCorp Vault

```hcl
# Enable Kubernetes authentication
vault auth enable kubernetes

vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc"

# Dynamic database credentials
vault write database/roles/readonly \
    db_name=postgres \
    creation_statements="CREATE ROLE \"{{name}}\" \
      WITH LOGIN PASSWORD '{{password}}';"
```

### AWS Secrets Manager

```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({ region: "ap-south-1" });
const response = await client.send(new GetSecretValueCommand({
    SecretId: "streamforge/db-credentials"
}));
const secrets = JSON.parse(response.SecretString);
```

---

## 🔐 Application Security

<details>
<summary><strong>🪙 Authentication (JWT)</strong></summary>

```javascript
const jwt = require('jsonwebtoken');

// Issue short-lived tokens
const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
);

const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

</details>

<details>
<summary><strong>🛡️ Authorization (RBAC Middleware)</strong></summary>

```javascript
const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

app.get('/admin', authorize('admin'), adminHandler);
```

</details>

<details>
<summary><strong>✅ Input Validation</strong></summary>

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/users',
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    }
);
```

</details>

<details>
<summary><strong>⏱️ Rate Limiting</strong></summary>

```javascript
const rateLimit = require('express-rate-limit');

app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                    // 100 requests per window
    message: 'Too many requests'
}));
```

</details>

---

## 🔏 Encryption

### Data at Rest

| Resource | Encryption |
|----------|-----------|
| 🗄️ RDS | KMS encryption enabled |
| 📦 S3 | Server-side encryption (SSE-KMS) |
| 💾 EBS | Encrypted volumes |
| 🔑 Secrets | AWS Secrets Manager / Vault |

### Data in Transit

- 🔒 **TLS 1.3** for all external traffic
- 🤝 **mTLS** for all service-to-service communication
- 🛡️ **WAF** on ALB with SSL termination

### KMS Key (Terraform)

```hcl
resource "aws_kms_key" "main" {
  description             = "StreamForge master key"
  deletion_window_in_days = 7
  enable_key_rotation     = true   # Auto-rotate annually
}
```

---

## 📋 Compliance

<details>
<summary><strong>💳 PCI-DSS Controls</strong></summary>

| Requirement | Implementation |
|-------------|---------------|
| 1.2 | Network segmentation with VPC |
| 3.4 | Encryption at rest (KMS) |
| 4.1 | Encryption in transit (TLS 1.3) |
| 7.1 | IAM least privilege |
| 10.1 | Audit logging (VPC Flow Logs + CloudTrail) |

</details>

<details>
<summary><strong>🏛️ SOC2 Controls</strong></summary>

| Control | Implementation |
|---------|---------------|
| CC6.1 | Access controls (IAM / RBAC) |
| CC7.1 | Monitoring (Prometheus + CloudWatch) |
| CC7.2 | Incident response playbook |
| CC8.1 | Change management (GitOps / ArgoCD) |

</details>

### Security Scanning Gates

| Stage | Scan Type | Tool |
|-------|-----------|------|
| Commit | SAST | SonarQube |
| Build | Container scan | Trivy |
| Deploy | DAST | OWASP ZAP |
| Runtime | CSPM | AWS Config |

### Vulnerability Management

```bash
# Daily critical CVE scan
trivy image --severity CRITICAL streamforge-backend:latest

# Generate Software Bill of Materials (SBOM)
syft streamforge-backend:latest -o spdx > sbom.spdx

# Detect leaked secrets in code
gitleaks detect --source . --verbose
```

---

## 🚨 Incident Response

### Playbook

```
1. 🔍 Detection    →  Alert fires from Prometheus / CloudWatch
2. 🧱 Containment  →  Network policy applied to isolate workload
3. 🔬 Investigation →  Log analysis via ELK / Kibana
4. 🔧 Remediation  →  Rollback triggered via ArgoCD
5. 📝 Post-mortem  →  Document findings, update runbooks
```

### Runbook Commands

<details>
<summary><strong>🚫 Block a suspicious IP</strong></summary>

```bash
kubectl create -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-external-ip
spec:
  podSelector: {}
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
          - 10.0.0.0/8
EOF
```

</details>

<details>
<summary><strong>⬇️ Emergency scale-down</strong></summary>

```bash
kubectl scale deployment backend \
  -n streamforge --replicas=0
```

</details>

<details>
<summary><strong>📋 Collect incident logs</strong></summary>

```bash
kubectl logs -l app=backend \
  -n streamforge --tail=1000 > incident.log
```

</details>

---

<div align="center">

↩️ [Back to Main README](./README.md) &nbsp;·&nbsp; ⚙️ [CI/CD Pipeline](./CICD.md)

</div>
