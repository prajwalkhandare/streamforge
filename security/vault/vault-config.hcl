# HashiCorp Vault Configuration
# Location: security/vault/vault-config.hcl
# Purpose: Vault server configuration for secrets management

# Storage configuration (using file storage for development)
# For production, use Consul, Raft, or Cloud storage
storage "file" {
  path = "/vault/data"
}

# Storage "raft" {
#   path = "/vault/data"
#   node_id = "node1"
# }

# HTTP Listener
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true  # Enable TLS in production
  
  # TLS Configuration (enable in production)
  # tls_cert_file = "/vault/config/cert.pem"
  # tls_key_file  = "/vault/config/key.pem"
}

# API Configuration
api_addr = "http://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"

# Seal Configuration (Auto-unseal with AWS KMS for production)
# seal "awskms" {
#   region     = "ap-south-1"
#   kms_key_id = "arn:aws:kms:ap-south-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# }

# Telemetry for monitoring
telemetry {
  statsite_address = "127.0.0.1:8125"
  disable_hostname = true
}

# UI Configuration
ui = true

# Logging
log_level = "info"
log_format = "json"

# Audit Logging
audit {
  file {
    path = "/vault/logs/audit.log"
    mode = "0600"
  }
}

# Authentication Backends
auth "token" {
  type = "token"
  config {
    default_lease_ttl = "768h"
    max_lease_ttl     = "768h"
  }
}

auth "kubernetes" {
  type = "kubernetes"
  config {
    kubernetes_host = "https://kubernetes.default.svc"
    kubernetes_ca_cert = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
    token_reviewer_jwt = "/var/run/secrets/kubernetes.io/serviceaccount/token"
  }
}

# Secrets Engines
secret "kv" {
  type = "kv-v2"
  config {
    max_versions = 10
  }
}

secret "database" {
  type = "database"
  config {
    plugin_name = "postgresql-database-plugin"
    allowed_roles = ["readonly", "readwrite"]
  }
}

secret "aws" {
  type = "aws"
  config {
    access_key = "AWS_ACCESS_KEY"
    secret_key = "AWS_SECRET_KEY"
    region = "ap-south-1"
  }
}

secret "transit" {
  type = "transit"
  config {
    default_lease_ttl = "24h"
    max_lease_ttl = "168h"
  }
}

# Policies
policy "admin" {
  name = "admin"
  path = "sys/*" {
    capabilities = ["create", "read", "update", "delete", "list", "sudo"]
  }
  path = "secret/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
  }
}

policy "readonly" {
  name = "readonly"
  path = "secret/*" {
    capabilities = ["read", "list"]
  }
}

# Roles
role "postgres-readonly" {
  name = "postgres-readonly"
  db_name = "postgres"
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
  ]
  default_ttl = "1h"
  max_ttl = "24h"
}

role "postgres-readwrite" {
  name = "postgres-readwrite"
  db_name = "postgres"
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";"
  ]
  default_ttl = "1h"
  max_ttl = "24h"
}

# Group Policies
group "platform-team" {
  policies = ["readonly", "database-read"]
}

# Helpers
ui {
  enabled = true
}

# Performance
max_lease_ttl = "768h"
default_lease_ttl = "768h"

# Unseal configuration (for development - DO NOT USE IN PRODUCTION)
# In production, use Shamir or Auto-unseal
# unseal_keys: generated during vault operator init