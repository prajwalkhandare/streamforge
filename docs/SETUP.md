<div align="center">

# 🎬 StreamForge

### A production-grade video streaming platform built on AWS & Kubernetes

[![AWS](https://img.shields.io/badge/AWS-EKS%20%7C%20RDS%20%7C%20S3%20%7C%20CloudFront-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/Terraform-v1.6+-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-v1.28+-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

> Deploy a scalable, cloud-native video streaming platform with full observability — in under 15 minutes.

<br/>

[🚀 Quick Start](#-quick-start) • [☁️ Infrastructure](#️-infrastructure) • [🛠️ Local Dev](#️-local-development) • [📊 Monitoring](#-monitoring) • [🔧 Troubleshooting](#-troubleshooting)

</div>

---

## ✨ Features

- 🎥 **Video streaming** with CDN-accelerated delivery via CloudFront
- ☁️ **Auto-scaling** EKS cluster with Kubernetes node group management
- 🗄️ **Multi-AZ PostgreSQL** RDS for high availability
- ⚡ **Redis caching** with ElastiCache for blazing-fast responses
- 📦 **S3 storage** for videos and static assets
- 📊 **Full observability** with Prometheus + Grafana dashboards
- 🔒 **IAM roles & policies** — security baked in by default
- 🌐 **Application Load Balancer** with ingress routing

---

## 🏗️ Architecture

```
                          ┌──────────────┐
                          │  CloudFront  │  CDN
                          └──────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Application Load       │
                    │     Balancer (ALB)      │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │           EKS Cluster               │
              │  ┌─────────────┐  ┌─────────────┐  │
              │  │  Frontend   │  │   Backend   │  │
              │  │  (React)    │  │  (Node.js)  │  │
              │  └─────────────┘  └──────┬──────┘  │
              └─────────────────────────┼───────────┘
                                        │
              ┌─────────────────────────┼──────────────────┐
              │                         │                  │
     ┌────────▼───────┐    ┌────────────▼──────┐   ┌──────▼──────┐
     │  RDS PostgreSQL │    │ ElastiCache Redis │   │  S3 Buckets │
     │   (Multi-AZ)   │    │                   │   │             │
     └────────────────┘    └───────────────────┘   └─────────────┘
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Install |
|------|---------|---------|
| **AWS CLI** | v2.x | [Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **Terraform** | v1.6+ | [Guide](https://developer.hashicorp.com/terraform/downloads) |
| **kubectl** | v1.28+ | [Guide](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | v3.x | [Guide](https://helm.sh/docs/intro/install/) |
| **Docker** | v24.x | [Guide](https://docs.docker.com/engine/install/) |
| **Node.js** | v20+ | [Guide](https://nodejs.org/) |
| **PostgreSQL** | v15+ | Local dev only |

---

## 🚀 Quick Start

### 1️⃣ Configure AWS

```bash
aws configure
# AWS Access Key ID:     YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region:        ap-south-1
# Default output format: json
```

### 2️⃣ Clone & Deploy Infrastructure

```bash
git clone https://github.com/prajwalkhandare/streamforge.git
cd streamforge/terraform/environments/dev

terraform init
terraform plan
terraform apply -auto-approve
```

> ⏱️ Infrastructure creation takes **~10–15 minutes**. This provisions:
> VPC · EKS Cluster · RDS PostgreSQL (Multi-AZ) · S3 Buckets · CloudFront CDN · ElastiCache Redis · ALB · IAM Roles

### 3️⃣ Connect kubectl to EKS

```bash
aws eks update-kubeconfig --region ap-south-1 --name streamforge-dev-cluster
kubectl get nodes   # Should show 3 nodes
```

### 4️⃣ Deploy Monitoring Stack

```bash
kubectl create namespace monitoring

# Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus -n monitoring

# Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana -n monitoring

# Get Grafana admin password
kubectl get secret -n monitoring grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

### 5️⃣ Deploy Application

```bash
kubectl create namespace streamforge

cd k8s/helm/streamforge
helm install streamforge . \
  --namespace streamforge \
  --create-namespace \
  --values values.yaml

kubectl get pods -n streamforge
kubectl get svc  -n streamforge
```

---

## 🛠️ Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Fill in your DB credentials
npm run db:migrate
npm run dev            # http://localhost:5000
```

<details>
<summary>📄 Example <code>.env</code> configuration</summary>

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=streamforge
DB_USER=postgres
DB_PASSWORD=yourpassword
```
</details>

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start              # http://localhost:3000
```

---

## 📊 Monitoring

| Service | URL | Credentials |
|---------|-----|-------------|
| 🌐 Frontend | http://localhost:3000 | — |
| ⚙️ Backend API | http://localhost:5000 | — |
| 💚 Health Check | http://localhost:5000/health | — |
| 📈 Grafana | http://localhost:3001 | `admin / admin` |
| 🔥 Prometheus | http://localhost:9090 | — |

---

## ✅ Verify Your Deployment

```bash
# All pods running?
kubectl get pods -n streamforge

# Services healthy?
kubectl get svc -n streamforge

# Ingress configured?
kubectl get ingress -n streamforge

# Get ALB endpoint
kubectl get svc -n streamforge streamforge-backend \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 🔧 Troubleshooting

<details>
<summary><strong>🔴 Terraform Apply Fails — AccessDeniedException</strong></summary>

```bash
# Verify your AWS credentials
aws sts get-caller-identity

# Check if EKS cluster role exists
aws iam get-role --role-name eks-cluster-role
```

Ensure your IAM user has the correct permissions attached.

</details>

<details>
<summary><strong>🔴 Terraform Timeout</strong></summary>

```bash
terraform apply -auto-approve -timeout=30m

# Debug via CloudFormation
aws cloudformation describe-stack-events \
  --stack-name eksctl-streamforge-cluster
```

</details>

<details>
<summary><strong>🔴 kubectl — Connection Refused</strong></summary>

```bash
# Refresh kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name streamforge-dev-cluster

# Check cluster status
aws eks describe-cluster --name streamforge-dev-cluster --query cluster.status

# Test connectivity
kubectl cluster-info
```

</details>

<details>
<summary><strong>🔴 Pods Stuck in Pending — Node Group Not Scaling</strong></summary>

```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name streamforge-dev-cluster \
  --nodegroup-name main

# Check autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Manually scale if needed
aws eks update-nodegroup-config \
  --cluster-name streamforge-dev-cluster \
  --nodegroup-name main \
  --scaling-config desiredSize=3,minSize=1,maxSize=10
```

</details>

---

## 📁 Project Structure

```
streamforge/
├── terraform/
│   └── environments/
│       └── dev/          # Terraform IaC for AWS
├── k8s/
│   └── helm/
│       └── streamforge/  # Helm chart for K8s deployment
├── backend/              # Node.js API server
│   ├── .env.example
│   └── src/
├── frontend/             # React frontend
│   ├── .env.example
│   └── src/
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

Made with ❤️ by [Prajwal Khandare](https://github.com/prajwalkhandare)

⭐ Star this repo if you found it useful!

</div>
