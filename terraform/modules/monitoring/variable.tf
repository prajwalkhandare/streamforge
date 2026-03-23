# terraform/modules/monitoring/variables.tf

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "enable_elk" {
  description = "Enable ELK stack"
  type        = bool
  default     = true
}

variable "prometheus_retention_days" {
  description = "Prometheus data retention in days"
  type        = number
  default     = 15
}

variable "prometheus_storage_size" {
  description = "Prometheus storage size"
  type        = string
  default     = "50Gi"
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
  default     = "admin"
}

variable "grafana_storage_size" {
  description = "Grafana storage size"
  type        = string
  default     = "10Gi"
}

variable "elasticsearch_storage_size" {
  description = "Elasticsearch storage size"
  type        = string
  default     = "100Gi"
}

variable "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint"
  type        = string
  default     = "elasticsearch-master:9200"
}

variable "elasticsearch_username" {
  description = "Elasticsearch username"
  type        = string
  default     = "elastic"
}

variable "elasticsearch_password" {
  description = "Elasticsearch password"
  type        = string
  sensitive   = true
  default     = "changeme"
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
  default     = "admin@example.com"
}

variable "node_hostname" {
  description = "Node hostname for Filebeat"
  type        = string
  default     = "node"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

