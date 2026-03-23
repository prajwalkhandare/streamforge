Overview
StreamForge uses a complete observability stack:

Tool	Purpose
Prometheus	Metrics collection and storage
Grafana	Visualization and dashboards
ELK Stack	Centralized logging
CloudWatch	AWS infrastructure metrics
AlertManager	Alert routing
Architecture
text
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATIONS                                │
│  Backend │ Frontend │ PostgreSQL │ Redis │ Nginx                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PROMETHEUS                                 │
│  Metrics Collection │ Time Series DB │ Alert Rules             │
└─────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    GRAFANA      │ │  ALERTMANAGER   │ │  CLOUDWATCH     │
│  Dashboards     │ │  Slack/Email    │ │  AWS Metrics    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
Prometheus Configuration
Metrics Collection
yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    
  - job_name: 'streamforge-backend'
    static_configs:
      - targets: ['streamforge-backend:5000']
Key Metrics
Metric	Description	Threshold
container_cpu_usage_seconds_total	CPU usage per pod	> 80%
container_memory_working_set_bytes	Memory usage per pod	> 2GB
http_requests_total	Total API requests	-
http_request_duration_seconds	Request latency	p95 < 500ms
pg_stat_database_numbackends	DB connections	> 50
Grafana Dashboards
Dashboard: Kubernetes Cluster
Panel	Description
CPU Usage	Pod CPU utilization
Memory Usage	Pod memory consumption
Network I/O	Ingress/Egress traffic
Node Status	Ready nodes count
Dashboard: API Metrics
Panel	Description
Request Rate	Requests per second
Duration (P95)	95th percentile latency
Error Rate	5xx error percentage
Active Connections	Current connections
Dashboard: Database
Panel	Description
Connections	Active DB connections
Query Throughput	Queries per second
CPU Utilization	RDS CPU %
Free Storage	Available storage
ELK Stack (Logging)
Log Sources
Source	Log Type	Retention
Backend API	Application logs	30 days
Frontend	Browser console	7 days
Kubernetes Pods	Container logs	15 days
PostgreSQL	Database logs	30 days
Nginx	Access/Error logs	7 days
Log Structure
json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "streamforge-backend",
  "message": "User logged in",
  "user_id": "uuid",
  "request_id": "req-123",
  "trace_id": "trace-456"
}
Alert Rules
Critical Alerts (PagerDuty)
yaml
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
SLO/SLI Definitions
Service Level Indicators (SLIs)
SLI	Target	Current
Availability	99.9%	99.95%
Latency (p95)	< 500ms	145ms
Error Rate	< 0.1%	0.03%
Throughput	1000 req/s	850 req/s
Service Level Objectives (SLOs)
SLO	Target	Error Budget
API Availability	99.9%	43 min/month
API Latency	< 500ms	95% of requests
Error Rate	< 0.1%	0.1% of requests
Running Monitoring Locally
Start Prometheus
bash
docker run -d -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
Start Grafana
bash
docker run -d -p 3000:3000 grafana/grafana
Start ELK Stack
bash
docker-compose -f monitoring/elk/docker-compose.yml up -d
Useful Commands
bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=up'

# Get Grafana admin password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# View logs
kubectl logs -n streamforge -l app=backend

# Stream logs to Elasticsearch
kubectl logs -n streamforge -l app=backend --tail=100 | nc elasticsearch 9200
Monitoring Troubleshooting
Prometheus not scraping
bash
# Check targets
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
curl http://localhost:9090/api/v1/targets
Grafana no data
bash
# Check datasource
kubectl port-forward -n monitoring svc/grafana 3000:80
# Login and verify Prometheus datasource
No logs in Kibana
bash
# Check Filebeat
kubectl logs -n monitoring -l app=filebeat

# Check Elasticsearch
kubectl port-forward -n monitoring svc/elasticsearch-master 9200:9200
curl http://localhost:9200/_cat/indices
================================================================================
SECURITY GUIDE
================================================================================

Overview
StreamForge implements defense-in-depth security:

Layer	Controls
Network	VPC isolation, Security Groups, Network Policies
Application	OWASP Top 10, Input validation, Rate limiting
Container	Image scanning, Non-root users, Read-only filesystem
Kubernetes	RBAC, Pod Security Standards, OPA policies
Secrets	HashiCorp Vault, AWS Secrets Manager
Compliance	PCI-DSS, SOC2, ISO 27001
Network Security
VPC Configuration
Private subnets for application workloads

Public subnets for load balancers only

NAT Gateway for outbound internet access

VPC Flow Logs enabled for audit

Security Groups
yaml
# EKS Cluster Security Group
- Ingress:
    - Port 443: Allow from VPC CIDR
- Egress:
    - All ports: Allow to anywhere

# RDS Security Group
- Ingress:
    - Port 5432: Allow from EKS node groups
- Egress:
    - Deny all

# Redis Security Group
- Ingress:
    - Port 6379: Allow from backend pods
- Egress:
    - Deny all
Kubernetes Network Policies
yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
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
Container Security
Image Scanning (Trivy)
bash
# Scan before deployment
trivy image streamforge-backend:latest \
  --severity HIGH,CRITICAL \
  --exit-code 1
Dockerfile Best Practices
dockerfile
# Use specific tags, not latest
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set proper permissions
COPY --chown=nodejs:nodejs . .

# Switch to non-root
USER nodejs

# Read-only filesystem
RUN chmod -R 555 /app

# Health check
HEALTHCHECK --interval=30s CMD node health.js
Pod Security Context
yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
Kubernetes Security
RBAC Configuration
yaml
# Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa

# Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-role
rules:
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "list"]

# RoleBinding
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
OPA Policies
rego
# Deny latest tag
deny[msg] {
    container := input.request.object.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg = "Using 'latest' tag is not allowed"
}

# Require resource limits
deny[msg] {
    container := input.request.object.spec.template.spec.containers[_]
    not container.resources.limits
    msg = "Resource limits required"
}
CIS Benchmarks
Run kube-bench to verify CIS compliance:

bash
docker run --rm -v /etc/kubernetes:/etc/kubernetes aquasec/kube-bench:latest
Secrets Management
HashiCorp Vault
hcl
# Enable Kubernetes auth
vault auth enable kubernetes

# Configure Kubernetes auth
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc"

# Create database role
vault write database/roles/readonly \
    db_name=postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}';"
AWS Secrets Manager
javascript
// Retrieve secret
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({ region: "ap-south-1" });
const response = await client.send(new GetSecretValueCommand({
    SecretId: "streamforge/db-credentials"
}));

const secrets = JSON.parse(response.SecretString);
Application Security
Authentication (JWT)
javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
Authorization (RBAC)
javascript
// Role-based middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};

// Usage
app.get('/admin', authorize('admin'), adminHandler);
Input Validation
javascript
const { body, validationResult } = require('express-validator');

app.post('/api/users',
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Process request
    }
);
Rate Limiting
javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests'
});

app.use('/api/auth', limiter);
Encryption
Data at Rest
RDS: KMS encryption enabled

S3: Server-side encryption with KMS

EBS: Encrypted volumes

Secrets: AWS Secrets Manager / Vault

Data in Transit
TLS 1.3 for all external traffic

mTLS for service-to-service communication

WAF for ALB with SSL termination

KMS Keys
hcl
resource "aws_kms_key" "main" {
  description             = "StreamForge master key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}
Compliance
PCI-DSS Controls
Requirement	Implementation
1.2	Network segmentation with VPC
3.4	Encryption at rest (KMS)
4.1	Encryption in transit (TLS)
7.1	IAM least privilege
10.1	Audit logging enabled
SOC2 Controls
Control	Implementation
CC6.1	Access controls (IAM/RBAC)
CC7.1	Monitoring (Prometheus)
CC7.2	Incident response
CC8.1	Change management (GitOps)
Security Scanning
CI/CD Security Gates
Stage	Scan Type	Tool
Commit	SAST	SonarQube
Build	Container scan	Trivy
Deploy	DAST	OWASP ZAP
Runtime	CSPM	AWS Config
Vulnerability Management
bash
# Daily vulnerability scan
trivy image --severity CRITICAL streamforge-backend:latest

# Generate SBOM
syft streamforge-backend:latest -o spdx > sbom.spdx

# Check for secrets
gitleaks detect --source . --verbose
Incident Response
Playbook
Detection: Alert from Prometheus/CloudWatch

Containment: Network policy to isolate

Investigation: Log analysis in ELK

Remediation: Rollback via ArgoCD

Post-mortem: Document and improve

Runbook Commands
bash
# Block IP
kubectl create -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-ip
spec:
  podSelector: {}
  ingress:
  - from:
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
EOF

# Scale down
kubectl scale deployment backend -n streamforge --replicas=0

# Collect logs
kubectl logs -l app=backend -n streamforge --tail=1000 > incident.log