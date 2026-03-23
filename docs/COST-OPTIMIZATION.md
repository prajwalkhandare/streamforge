Overview
StreamForge implements FinOps best practices to optimize cloud costs:

Strategy	Savings
Spot Instances	60-70% on compute
Right-sizing	20-30% on resources
S3 Lifecycle	50% on storage
Reserved Instances	40% on databases
Auto-scaling	15% on idle resources
Current Cost Breakdown
Service	Monthly Cost	Optimization
EKS Cluster	$73	Free tier eligible
EC2 Nodes	$210	60% SPOT savings
RDS	$185	Multi-AZ overhead
S3 Storage	$25	Lifecycle rules
Data Transfer	$45	CloudFront CDN
CloudFront	$30	Price class 100
ELB	$20	Idle resources
Monitoring	$15	Prometheus local
Total	$603	Target: $400
Compute Optimization
Spot Instances
hcl
# EKS Node Group with Spot
resource "aws_eks_node_group" "main" {
  capacity_type = "SPOT"
  
  instance_types = ["t3.medium", "t3.large"]
  
  scaling_config {
    desired_size = 3
    min_size     = 1
    max_size     = 10
  }
}
Right-sizing
bash
# Analyze CPU/Memory usage
kubectl top pods -n streamforge

# Right-size based on actual usage
resources:
  requests:
    memory: "256Mi"  # Actual: 180Mi
    cpu: "250m"      # Actual: 200m
  limits:
    memory: "512Mi"
    cpu: "500m"
Cluster Autoscaler
yaml
apiVersion: autoscaling/v1
kind: ClusterAutoscaler
metadata:
  name: cluster-autoscaler
spec:
  scaleDown:
    enabled: true
    delayAfterAdd: 10m
    delayAfterDelete: 5m
    delayAfterFailure: 3m
    unneededTime: 10m
Storage Optimization
S3 Lifecycle Policies
hcl
resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    id     = "transition"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}
EBS Optimization
hcl
# Use gp3 instead of gp2 (20% cheaper)
resource "aws_ebs_volume" "main" {
  type = "gp3"
  size = 100
  
  # gp3 gives baseline performance without extra cost
  throughput = 125
  iops       = 3000
}
RDS Storage
hcl
# Use gp3 for RDS
resource "aws_db_instance" "main" {
  storage_type = "gp3"
  allocated_storage = 100
  
  # Backup retention
  backup_retention_period = 30
}
Networking Optimization
CloudFront Price Class
hcl
resource "aws_cloudfront_distribution" "main" {
  price_class = "PriceClass_100"  # Only India/Asia
  
  # Instead of PriceClass_All (worldwide)
  # Saves 30-40% on data transfer
}
NAT Gateway
hcl
# Use single NAT Gateway instead of multiple
resource "aws_nat_gateway" "main" {
  count = 1  # Instead of 3 (one per AZ)
  
  # For HA, use 2 NAT Gateways
  # For dev, 1 is sufficient
}
VPC Endpoints
hcl
# Use VPC Endpoints instead of NAT Gateway
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.ap-south-1.s3"
  
  # Saves data transfer costs
}
Database Optimization
Read Replicas
hcl
# Use read replicas for reporting queries
resource "aws_db_instance" "replica" {
  replicate_source_db = aws_db_instance.main.id
  
  instance_class = "db.t3.small"  # Smaller than primary
}
Connection Pooling
javascript
// Use PgBouncer for connection pooling
const pool = new Pool({
  host: process.env.DB_HOST,
  max: 20,  // Connection limit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
Query Optimization
sql
-- Add indexes
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);

-- Analyze queries
EXPLAIN ANALYZE SELECT * FROM videos WHERE category = 'Action';
Monitoring Cost
CloudWatch
hcl
# Reduce CloudWatch log retention
resource "aws_cloudwatch_log_group" "eks" {
  retention_in_days = 7  # Instead of 30 for dev
}

# Disable detailed monitoring for dev
resource "aws_launch_template" "main" {
  monitoring {
    enabled = false  # Saves $3.50 per instance
  }
}
Prometheus
yaml
# Reduce retention for dev
server:
  retention: 7d  # Instead of 15d

# Disable expensive metrics
scrape_configs:
  - job_name: 'kubernetes-pods'
    metrics_path: '/metrics'
    scrape_interval: 30s  # Instead of 15s
