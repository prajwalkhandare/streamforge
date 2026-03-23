# STREAMFORGE - COMPLETE DOCUMENTATION

================================================================================
                               SETUP GUIDE
================================================================================

## Prerequisites

### Required Tools
- **AWS CLI** (v2.x) - [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Terraform** (v1.6+) - [Install Guide](https://developer.hashicorp.com/terraform/downloads)
- **kubectl** (v1.28+) - [Install Guide](https://kubernetes.io/docs/tasks/tools/)
- **Helm** (v3.x) - [Install Guide](https://helm.sh/docs/intro/install/)
- **Docker** (v24.x) - [Install Guide](https://docs.docker.com/engine/install/)
- **Node.js** (v20+) - [Install Guide](https://nodejs.org/)
- **PostgreSQL** (v15+) - For local development

### AWS Account Setup
1. Create AWS account at https://aws.amazon.com
2. Create IAM user with Admin access
3. Generate Access Key and Secret Key
4. Configure AWS CLI:

aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: ap-south-1
# Default output format: json
Step 1: Clone Repository

git clone https://github.com/prajwalkhandare/streamforge.git
cd streamforge
Step 2: Deploy Infrastructure (Terraform)

cd terraform/environments/dev

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure
terraform apply -auto-approve

# Wait for infrastructure creation (~10-15 minutes)
This creates:

VPC with public/private subnets

EKS Cluster with node groups

RDS PostgreSQL (Multi-AZ)

S3 buckets for videos and static files

CloudFront CDN distribution

ElastiCache Redis cluster

Application Load Balancer

IAM roles and policies

Step 3: Configure kubectl for EKS
bash
# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name streamforge-dev-cluster

# Verify connection
kubectl get nodes
# Should show 3 nodes
Step 4: Deploy Monitoring Stack

# Create monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus -n monitoring

# Deploy Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana -n monitoring

# Get Grafana admin password
kubectl get secret -n monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode
Step 5: Deploy Application

# Create namespace
kubectl create namespace streamforge

# Deploy with Helm
cd k8s/helm/streamforge
helm install streamforge . \
  --namespace streamforge \
  --create-namespace \
  --values values.yaml

# Check deployment status
kubectl get pods -n streamforge
kubectl get svc -n streamforge
Step 6: Run Backend Locally (Development)

cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=streamforge
# DB_USER=postgres
# DB_PASSWORD=yourpassword

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
# Server running at http://localhost:5000
Step 7: Run Frontend Locally (Development)

cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
# Frontend running at http://localhost:3000
Step 8: Access the Application
Service	URL
Frontend	http://localhost:3000
Backend API	http://localhost:5000
API Health Check	http://localhost:5000/health
Grafana	http://localhost:3001 (admin/admin)
Prometheus	http://localhost:9090
Step 9: Verify Deployment

# Check all pods are running
kubectl get pods -n streamforge

# Check services
kubectl get svc -n streamforge

# Check ingress
kubectl get ingress -n streamforge

# Get ALB endpoint
kubectl get svc -n streamforge streamforge-backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
Setup Troubleshooting
Terraform Apply Fails
Error: Error: Error creating EKS cluster: AccessDeniedException

Solution:


# Verify AWS credentials
aws sts get-caller-identity

# Ensure IAM role has correct permissions
# Check if role exists
aws iam get-role --role-name eks-cluster-role
Error: Error: timeout while waiting for state to become 'success'

Solution:


# Increase timeout
terraform apply -auto-approve -timeout=30m

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name eksctl-streamforge-cluster
EKS Cluster Not Responding
Symptom: kubectl get nodes returns connection refused

Solution:


# Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name streamforge-dev-cluster

# Check cluster status
aws eks describe-cluster --name streamforge-dev-cluster --query cluster.status

# Test API server connectivity
kubectl cluster-info
Node Group Not Scaling
Symptom: New pods stuck in pending

Solution:


# Check node group status
aws eks describe-nodegroup --cluster-name streamforge-dev-cluster --nodegroup-name main

# Check cluster autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Manually scale node group
aws eks update-nodegroup-config \
  --cluster-name streamforge-dev-cluster \
  --nodegroup-name main \
  --scaling-config desiredSize=3,minSize=1,maxSize=10