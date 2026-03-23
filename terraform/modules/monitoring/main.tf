# terraform/modules/monitoring/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }
}

# Create monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name        = "monitoring"
      environment = var.environment
    }
  }
}

# Helm release for Prometheus
resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  version    = "25.0.0"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [
    templatefile("${path.module}/templates/prometheus-values.yaml", {
      retention_days = var.prometheus_retention_days
      storage_size   = var.prometheus_storage_size
    })
  ]

  set {
    name  = "server.persistentVolume.enabled"
    value = "true"
  }

  set {
    name  = "server.retention"
    value = "${var.prometheus_retention_days}d"
  }
}

# Helm release for Grafana
resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  version    = "7.0.0"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [
    templatefile("${path.module}/templates/grafana-values.yaml", {
      admin_password = var.grafana_admin_password
      storage_size   = var.grafana_storage_size
    })
  ]

  set {
    name  = "persistence.enabled"
    value = "true"
  }

  set {
    name  = "persistence.size"
    value = var.grafana_storage_size
  }

  set {
    name  = "adminPassword"
    value = var.grafana_admin_password
  }
}

# Helm release for Elasticsearch
resource "helm_release" "elasticsearch" {
  name       = "elasticsearch"
  repository = "https://helm.elastic.co"
  chart      = "elasticsearch"
  version    = "8.5.1"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  values = [
    templatefile("${path.module}/templates/elasticsearch-values.yaml", {
      storage_size = var.elasticsearch_storage_size
    })
  ]

  count = var.enable_elk ? 1 : 0
}

# Helm release for Kibana
resource "helm_release" "kibana" {
  name       = "kibana"
  repository = "https://helm.elastic.co"
  chart      = "kibana"
  version    = "8.5.1"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  set {
    name  = "elasticsearchHosts"
    value = "http://elasticsearch-master:9200"
  }

  count = var.enable_elk ? 1 : 0
}

# Helm release for Filebeat (log collector)
resource "helm_release" "filebeat" {
  name       = "filebeat"
  repository = "https://helm.elastic.co"
  chart      = "filebeat"
  version    = "8.5.1"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  set {
    name  = "filebeatConfig.filebeat\\.yml"
    value = <<-EOT
      filebeat.inputs:
      - type: container
        paths:
          - /var/log/containers/*.log
        processors:
          - add_kubernetes_metadata:
              host: ${var.node_hostname}
              matchers:
              - logs_path:
                  logs_path: "/var/log/containers/"
      output.elasticsearch:
        host: '${var.elasticsearch_endpoint}'
        username: '${var.elasticsearch_username}'
        password: '${var.elasticsearch_password}'
    EOT
  }

  count = var.enable_elk ? 1 : 0
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EKS", "cluster_failed_node_count", { stat = "Average" }],
            ["AWS/EKS", "node_cpu_utilization", { stat = "Average" }],
            ["AWS/EKS", "node_memory_utilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "EKS Cluster Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "eks_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-eks-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "node_cpu_utilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EKS CPU utilization"
  alarm_actions       = []

  dimensions = {
    ClusterName = var.eks_cluster_name
  }

  tags = var.tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Prometheus Rule Groups (via Kubernetes)
resource "kubernetes_config_map" "prometheus_rules" {
  metadata {
    name      = "prometheus-rules"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "alerts.yml" = <<-EOT
      groups:
        - name: StreamForgeAlerts
          rules:
            - alert: HighCPULoad
              expr: sum(rate(container_cpu_usage_seconds_total{container!=""}[5m])) by (pod) > 0.8
              for: 5m
              labels:
                severity: critical
              annotations:
                summary: "High CPU load on {{ $labels.pod }}"
                
            - alert: HighMemoryLoad
              expr: sum(container_memory_working_set_bytes{container!=""}) by (pod) > 2e9
              for: 5m
              labels:
                severity: critical
              annotations:
                summary: "High memory load on {{ $labels.pod }}"
                
            - alert: PodDown
              expr: kube_pod_status_phase{phase="Running"} < 1
              for: 2m
              labels:
                severity: critical
              annotations:
                summary: "Pod {{ $labels.pod }} is down"
                
            - alert: APIHighLatency
              expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="backend"}[5m])) by (le, endpoint)) > 0.5
              for: 5m
              labels:
                severity: warning
              annotations:
                summary: "High latency on {{ $labels.endpoint }}"
    EOT
  }
}
