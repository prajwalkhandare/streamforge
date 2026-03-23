
---

## 🔧 Complete Terraform Code

### `terraform/environments/dev/main.tf`

```hcl
# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "StreamForge"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "DevOps"
    }
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"
  
  environment         = var.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# EKS Module
module "eks" {
  source = "../../modules/eks"
  
  environment    = var.environment
  cluster_name   = "streamforge-${var.environment}-cluster"
  cluster_version = "1.28"
  
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  
  node_groups = {
    main = {
      desired_size = 3
      min_size     = 1
      max_size     = 10
      
      instance_types = ["t3.medium", "t3.large"]
      capacity_type  = "SPOT"  # 60% cost savings
      
      labels = {
        role = "application"
      }
      
      tags = {
        "k8s.io/cluster-autoscaler/enabled" = "true"
      }
    }
  }
  
  enable_irsa = true
}

# RDS PostgreSQL Module
module "rds" {
  source = "../../modules/rds"
  
  environment = var.environment
  identifier  = "streamforge-${var.environment}-db"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  storage_encrypted     = true
  storage_type         = "gp3"
  
  db_name  = "streamforge"
  username = var.db_username
  password = var.db_password
  
  multi_az               = true
  publicly_accessible    = false
  deletion_protection    = true
  
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# S3 + CloudFront Module
module "s3_cloudfront" {
  source = "../../modules/s3-cloudfront"
  
  environment = var.environment
  
  buckets = {
    videos = {
      name          = "streamforge-${var.environment}-videos"
      versioning    = true
      encryption    = true
      lifecycle_rule = {
        enabled = true
        transition = [
          {
            days          = 30
            storage_class = "STANDARD_IA"
          },
          {
            days          = 90
            storage_class = "GLACIER"
          }
        ]
      }
    }
    thumbnails = {
      name          = "streamforge-${var.environment}-thumbnails"
      versioning    = false
      encryption    = true
    }
  }
  
  cloudfront = {
    enabled             = true
    price_class         = "PriceClass_100"
    default_root_object = "index.html"
    
    geo_restriction = {
      restriction_type = "none"
    }
  }
}

# ElastiCache Redis Module
module "elasticache" {
  source = "../../modules/elasticache"
  
  environment = var.environment
  cluster_id = "streamforge-${var.environment}-redis"
  
  engine         = "redis"
  engine_version = "7.0"
  node_type      = "cache.t3.micro"
  
  num_cache_nodes = 2
  parameter_group_family = "redis7"
  
  subnet_group_name = module.vpc.elasticache_subnet_group_name
  security_group_ids = [aws_security_group.redis.id]
  
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer Module
module "alb" {
  source = "../../modules/alb"
  
  environment = var.environment
  name        = "streamforge-${var.environment}-alb"
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.public_subnet_ids
  
  idle_timeout    = 60
  enable_deletion_protection = true
  
  enable_waf      = true
  
  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      
      default_action = {
        type = "redirect"
        redirect = {
          port        = "443"
          protocol    = "HTTPS"
          status_code = "HTTP_301"
        }
      }
    }
    
    https = {
      port            = 443
      protocol        = "HTTPS"
      ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"
      certificate_arn = var.certificate_arn
      
      default_action = {
        type = "fixed-response"
        fixed_response = {
          content_type = "text/plain"
          message_body = "Hello from StreamForge ALB"
          status_code  = "200"
        }
      }
    }
  }
  
  access_logs = {
    bucket = "streamforge-${var.environment}-logs"
    enabled = true
  }
}

# Outputs
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "cloudfront_domain" {
  value = module.s3_cloudfront.cloudfront_domain_name
}

output "alb_dns_name" {
  value = module.alb.dns_name
}
