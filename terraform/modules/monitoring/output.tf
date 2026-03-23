# terraform/modules/monitoring/outputs.tf

output "prometheus_endpoint" {
  description = "Prometheus endpoint"
  value       = "http://prometheus-server.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:80"
}

output "grafana_endpoint" {
  description = "Grafana endpoint"
  value       = "http://grafana.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:80"
}

output "grafana_admin_password" {
  description = "Grafana admin password"
  value       = var.grafana_admin_password
  sensitive   = true
}

output "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint"
  value       = var.enable_elk ? "http://elasticsearch-master.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:9200" : null
}

output "kibana_endpoint" {
  description = "Kibana endpoint"
  value       = var.enable_elk ? "http://kibana.${kubernetes_namespace.monitoring.metadata[0].name}.svc.cluster.local:5601" : null
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "monitoring_namespace" {
  description = "Monitoring namespace"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}

