# 🗺️ AWS Infrastructure Resource Map

## VPC Network
| Resource | Name | Details |
|----------|------|---------|
| VPC | streamforge-dev-vpc | CIDR: 10.0.0.0/16 |
| Public Subnet 1 | public-ap-south-1a | 10.0.1.0/24 |
| Public Subnet 2 | public-ap-south-1b | 10.0.2.0/24 |
| Public Subnet 3 | public-ap-south-1c | 10.0.3.0/24 |
| Private Subnet 1 | private-ap-south-1a | 10.0.10.0/24 |
| Private Subnet 2 | private-ap-south-1b | 10.0.11.0/24 |
| Private Subnet 3 | private-ap-south-1c | 10.0.12.0/24 |
| Internet Gateway | igw-streamforge | Attached to VPC |
| NAT Gateway | nat-streamforge | In public subnet |
| Route Tables | public-rt, private-rt | Custom routes |

## EKS Kubernetes Cluster
| Resource | Name | Details |
|----------|------|---------|
| EKS Cluster | streamforge-dev-cluster | K8s version 1.28 |
| Node Group 1 | ng-1 | 3x t3.medium (SPOT) |
| Node Group 2 | ng-2 | 2x t3.large (ON-DEMAND) |
| OIDC Provider | eks-oidc-provider | For IAM roles |

## RDS PostgreSQL
| Resource | Name | Details |
|----------|------|---------|
| DB Instance | streamforge-dev-db | PostgreSQL 15.3 |
| Instance Class | - | db.t3.medium |
| Storage | - | 100GB gp3 encrypted |
| Multi-AZ | - | Enabled (2 AZs) |
| Backup Retention | - | 30 days |
| Subnet Group | rds-subnet-group | Private subnets |

## S3 Storage
| Bucket Name | Purpose | Features |
|-------------|---------|----------|
| streamforge-dev-videos | Video content storage | Versioning, encryption, lifecycle |
| streamforge-dev-thumbnails | Video thumbnails | Encryption only |
| streamforge-dev-static | Frontend hosting | Static website enabled |
| streamforge-dev-logs | Access logs | Lifecycle to Glacier |

## CloudFront
| Distribution | Domain | Origin |
|--------------|--------|--------|
| Videos CDN | d123.cloudfront.net | S3 Videos + ALB |
| Static CDN | d456.cloudfront.net | S3 Static |

## ElastiCache Redis
| Cluster | Node Type | Nodes |
|---------|-----------|-------|
| streamforge-dev-redis | cache.t3.micro | 2 nodes (Multi-AZ) |

## Load Balancer
| Resource | Name | Details |
|----------|------|---------|
| ALB | streamforge-dev-alb | Internet-facing |
| Target Group | tg-backend | Points to EKS pods |
| Listeners | HTTP:80 → HTTPS:443 | SSL termination |
| WAF | waf-streamforge | Rate limiting, SQL injection |

## IAM Roles
| Role Name | Used By | Permissions |
|-----------|---------|-------------|
| eks-cluster-role | EKS Cluster | EC2, ELB, CloudWatch |
| eks-node-role | Worker Nodes | ECR, S3, CloudWatch |
| rds-monitoring-role | RDS | CloudWatch metrics |
| cicd-deploy-role | Jenkins | ECR, EKS access |

## Monitoring
| Resource | Name | Retention |
|----------|------|-----------|
| CloudWatch Logs | /aws/eks/cluster | 30 days |
| CloudWatch Logs | /aws/rds/instance | 30 days |
| CloudWatch Dashboards | streamforge-dashboard | Custom metrics |
| Prometheus | prometheus-server | 15 days retention |
| Grafana | grafana-server | Custom dashboards |

## Security
| Resource | Name | Purpose |
|----------|------|---------|
| KMS Key | kms-streamforge | Encryption at rest |
| Secrets Manager | db-secret | Database credentials |
| Security Groups | sg-eks, sg-rds, sg-redis | Network isolation |
| ACM Certificate | *.streamforge.dev | SSL/TLS |
| Cognito Pool | streamforge-users | User authentication |

## Cost Breakdown (Monthly)
| Service | Cost | Optimization |
|---------|------|--------------|
| EKS Cluster | $73 | Free tier eligible |
| EC2 (Nodes) | $210 | 60% SPOT savings |
| RDS | $185 | Multi-AZ overhead |
| S3 | $25 | Lifecycle rules active |
| Data Transfer | $45 | CloudFront reduces cost |
| **Total** | **$538** | **30% below estimate** |