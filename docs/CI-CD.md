Overview
StreamForge uses a comprehensive CI/CD pipeline with:

Jenkins for build automation

GitHub Actions for continuous integration

ArgoCD for GitOps-based continuous deployment

Pipeline Architecture
text
┌─────────────────────────────────────────────────────────────────┐
│                         GITHUB REPOSITORY                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS (CI)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Lint   │ │  Test   │ │ SonarQ │ │ Trivy  │ │ Build   │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AMAZON ECR                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  streamforge-backend:latest | streamforge-frontend:latest │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ARGOCD (CD)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  GitOps Sync → Blue-Green Deployment → EKS              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
GitHub Actions Workflow
Workflow Triggers
Push to main/master: Full pipeline

Push to develop: Build + test only

Pull Request: Security scan + tests

Manual trigger: Deploy to specific environment

Pipeline Stages
Stage	Description	Tools
Security Scan	Vulnerability scanning	Trivy
Lint	Code quality checks	ESLint, Prettier
Test	Unit and integration tests	Jest
SonarQube	Code quality gate	SonarQube
Build	Docker image creation	Docker, Buildx
Push	Upload to ECR	AWS CLI
Deploy	Helm upgrade	Helm, kubectl
Jenkins Pipeline
Jenkinsfile Stages
groovy
pipeline {
    stages {
        stage('Checkout') { ... }
        stage('Install Dependencies') { ... }
        stage('Unit Tests') { ... }
        stage('SonarQube Analysis') { ... }
        stage('Quality Gate') { ... }
        stage('Docker Build') { ... }
        stage('Trivy Security Scan') { ... }
        stage('Push to ECR') { ... }
        stage('Update Helm Values') { ... }
        stage('ArgoCD Sync') { ... }
    }
}
ArgoCD GitOps
Application Definition
yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: streamforge-dev
spec:
  source:
    repoURL: https://github.com/prajwalkhandare/streamforge
    targetRevision: HEAD
    path: k8s/helm/streamforge
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
Blue-Green Deployment
yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: backend-rollout
spec:
  strategy:
    blueGreen:
      activeService: backend-active
      previewService: backend-preview
      autoPromotionEnabled: false
Environment Strategy
Environment	Branch	Auto-deploy	Approval
dev	develop	✅ Yes	❌ No
staging	main	✅ Yes	⚠️ Manual
production	main	❌ No	✅ Required
Key Metrics
Metric	Target	Current
Build Time	< 10 min	7.5 min
Deployment Frequency	10+/day	Achieved
Deployment Success Rate	> 99%	99.5%
MTTR	< 30 min	12 min
Secrets Management
All secrets are stored in:

GitHub Secrets - For CI/CD variables

AWS Secrets Manager - Database credentials

HashiCorp Vault - Application secrets

Running Pipeline Locally
Run GitHub Actions locally (using act)
bash
# Install act
brew install act

# Run workflow
act push
Run Jenkins locally
bash
docker run -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
Test ArgoCD locally
bash
# Install ArgoCD CLI
brew install argocd

# Login to local instance
argocd login localhost:8080
CI/CD Troubleshooting
Failed GitHub Actions
Check workflow logs in GitHub UI

Verify secrets are configured

Check AWS credentials

Jenkins Build Fails
bash
# Check Jenkins logs
docker logs jenkins

# Restart Jenkins
docker restart jenkins
ArgoCD Sync Issues
bash
# Check sync status
argocd app get streamforge-dev

# Force sync
argocd app sync streamforge-dev --force
Best Practices
Never commit secrets to repository

Use semantic versioning for Docker tags

Run security scans on every PR

Monitor pipeline metrics in Grafana

Keep dependencies updated using Dependabot
