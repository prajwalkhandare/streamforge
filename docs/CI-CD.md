<div align="center">

# ⚙️ CI/CD Pipeline

### Automated build, test, security scan, and GitOps deployment — end to end.

[![Jenkins](https://img.shields.io/badge/Jenkins-Build%20Automation-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![ArgoCD](https://img.shields.io/badge/ArgoCD-GitOps%20CD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)](https://argo-cd.readthedocs.io/)
[![Amazon ECR](https://img.shields.io/badge/Amazon%20ECR-Container%20Registry-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/ecr/)
[![SonarQube](https://img.shields.io/badge/SonarQube-Code%20Quality-4E9BCD?style=for-the-badge&logo=sonarqube&logoColor=white)](https://www.sonarqube.org/)
[![Trivy](https://img.shields.io/badge/Trivy-Security%20Scan-1904DA?style=for-the-badge&logo=aquasecurity&logoColor=white)](https://trivy.dev/)

</div>

---

## 🗺️ Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  🐙  GITHUB REPOSITORY                                           │
│      Push · Pull Request · Manual Trigger                        │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  ✅  GITHUB ACTIONS — Continuous Integration                     │
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────┐ │
│   │  🔍 Lint │→│ 🧪 Test  │→│ 📊 Sonar │→│🛡️ Trivy│→│🐳 Build│ │
│   └─────────┘  └─────────┘  └──────────┘  └────────┘  └──────┘ │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  📦  AMAZON ECR — Container Registry                             │
│                                                                  │
│   streamforge-backend:latest  │  streamforge-frontend:latest     │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  🚀  ARGOCD — GitOps Continuous Deployment                       │
│                                                                  │
│   GitOps Sync  →  Blue-Green Rollout  →  EKS Cluster            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Workflow Triggers

| Event | Pipeline Stages | Environment |
|---|---|---|
| Push to `main` | Full pipeline (lint → test → scan → build → deploy) | Staging |
| Push to `develop` | Build + test only | Dev |
| Pull Request | Security scan + tests | — |
| Manual trigger | Deploy to specified environment | Any |

---

## 🟦 GitHub Actions — CI Stages

| # | Stage | Description | Tool |
|---|-------|-------------|------|
| 1 | 🛡️ **Security Scan** | Vulnerability scanning on dependencies & images | Trivy |
| 2 | 🔍 **Lint** | Code style and quality enforcement | ESLint, Prettier |
| 3 | 🧪 **Test** | Unit and integration tests | Jest |
| 4 | 📊 **SonarQube** | Code quality gate — blocks bad merges | SonarQube |
| 5 | 🐳 **Build** | Docker image creation with Buildx | Docker |
| 6 | 📤 **Push** | Upload image to Amazon ECR | AWS CLI |
| 7 | 🚢 **Deploy** | Helm upgrade on EKS | Helm, kubectl |

---

## 🟧 Jenkins Pipeline

<details>
<summary><strong>📄 View Jenkinsfile Stages</strong></summary>

```groovy
pipeline {
    stages {
        stage('Checkout')              { /* Pull latest code */ }
        stage('Install Dependencies')  { /* npm install */ }
        stage('Unit Tests')            { /* Jest test suite */ }
        stage('SonarQube Analysis')    { /* Static analysis */ }
        stage('Quality Gate')          { /* Block on failure */ }
        stage('Docker Build')          { /* Build image */ }
        stage('Trivy Security Scan')   { /* Scan image */ }
        stage('Push to ECR')           { /* Upload to registry */ }
        stage('Update Helm Values')    { /* Bump image tag */ }
        stage('ArgoCD Sync')           { /* Trigger deployment */ }
    }
}
```

</details>

---

## 🟩 ArgoCD — GitOps Deployment

### Application Definition

```yaml
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
      prune: true       # Remove stale resources
      selfHeal: true    # Auto-correct drift
```

### 🔵🟢 Blue-Green Deployment Strategy

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: backend-rollout
spec:
  strategy:
    blueGreen:
      activeService: backend-active       # 🟢 Live traffic
      previewService: backend-preview     # 🔵 Staging traffic
      autoPromotionEnabled: false         # Requires manual approval
```

---

## 🌍 Environment Strategy

| Environment | Branch | Auto-Deploy | Approval Required |
|-------------|--------|:-----------:|:-----------------:|
| 🟢 **dev** | `develop` | ✅ Yes | ❌ No |
| 🟡 **staging** | `main` | ✅ Yes | ⚠️ Manual review |
| 🔴 **production** | `main` | ❌ No | ✅ Required |

---

## 📈 Key Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| ⏱️ Build Time | < 10 min | 7.5 min | ✅ |
| 🚀 Deployment Frequency | 10+ / day | Achieved | ✅ |
| ✅ Deployment Success Rate | > 99% | 99.5% | ✅ |
| 🔧 MTTR | < 30 min | 12 min | ✅ |

---

## 🔐 Secrets Management

| Store | Used For |
|-------|----------|
| 🔑 **GitHub Secrets** | CI/CD pipeline variables |
| 🛡️ **AWS Secrets Manager** | Database credentials |
| 🏛️ **HashiCorp Vault** | Application-level secrets |

> ⚠️ **Golden rule:** Never commit secrets to the repository.

---

## 💻 Running the Pipeline Locally

### GitHub Actions (via `act`)

```bash
# Install act
brew install act

# Run workflow locally
act push
```

### Jenkins

```bash
# Start Jenkins in Docker
docker run -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
```

### ArgoCD

```bash
# Install ArgoCD CLI
brew install argocd

# Login to local instance
argocd login localhost:8080
```

---

## 🔧 Troubleshooting

<details>
<summary><strong>🔴 GitHub Actions Failing</strong></summary>

1. Open the workflow run in the **GitHub Actions** tab
2. Expand the failing step and read the logs
3. Verify all required secrets are configured under `Settings → Secrets`
4. Check your AWS credentials haven't expired

</details>

<details>
<summary><strong>🔴 Jenkins Build Fails</strong></summary>

```bash
# Tail Jenkins logs
docker logs jenkins

# Restart if unresponsive
docker restart jenkins
```

</details>

<details>
<summary><strong>🔴 ArgoCD Sync Issues</strong></summary>

```bash
# Check current sync status
argocd app get streamforge-dev

# Force a re-sync
argocd app sync streamforge-dev --force
```

</details>

---

## ✅ Best Practices

- 🔒 **Never commit secrets** to the repository — use Vault / Secrets Manager
- 🏷️ **Use semantic versioning** for all Docker image tags
- 🛡️ **Run security scans on every PR** — block merges on critical CVEs
- 📊 **Monitor pipeline metrics** in Grafana dashboards
- 🤖 **Keep dependencies updated** automatically with Dependabot

---

<div align="center">

↩️ [Back to Main README](./README.md)

</div>
