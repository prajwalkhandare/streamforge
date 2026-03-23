# terraform/modules/s3-cloudfront/outputs.tf

output "videos_bucket_name" {
  description = "Videos S3 bucket name"
  value       = aws_s3_bucket.videos.id
}

output "videos_bucket_arn" {
  description = "Videos S3 bucket ARN"
  value       = aws_s3_bucket.videos.arn
}

output "thumbnails_bucket_name" {
  description = "Thumbnails S3 bucket name"
  value       = aws_s3_bucket.thumbnails.id
}

output "static_bucket_name" {
  description = "Static website S3 bucket name"
  value       = aws_s3_bucket.static.id
}

output "static_bucket_website_endpoint" {
  description = "Static website endpoint"
  value       = aws_s3_bucket_website_configuration.static.website_endpoint
}

output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "origin_access_identity_path" {
  description = "CloudFront origin access identity path"
  value       = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.s3.arn
}

output "cloudfront_oai_arn" {
  description = "CloudFront origin access identity ARN"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}
