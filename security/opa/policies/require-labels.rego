# OPA Policy: Require Kubernetes Labels
# Location: security/opa/policies/require-labels.rego
# Purpose: Enforce mandatory labels on all Kubernetes resources

package kubernetes.admission

# Deny if deployment doesn't have required labels
deny[msg] {
    input.request.kind.kind == "Deployment"
    not input.request.object.metadata.labels.app
    msg = sprintf("Deployment %s must have 'app' label", [input.request.object.metadata.name])
}

deny[msg] {
    input.request.kind.kind == "Deployment"
    not input.request.object.metadata.labels.environment
    msg = sprintf("Deployment %s must have 'environment' label", [input.request.object.metadata.name])
}

deny[msg] {
    input.request.kind.kind == "Deployment"
    not input.request.object.metadata.labels.team
    msg = sprintf("Deployment %s must have 'team' label", [input.request.object.metadata.name])
}

# Deny if service doesn't have required labels
deny[msg] {
    input.request.kind.kind == "Service"
    not input.request.object.metadata.labels.app
    msg = sprintf("Service %s must have 'app' label", [input.request.object.metadata.name])
}

# Deny if pod doesn't have required labels
deny[msg] {
    input.request.kind.kind == "Pod"
    not input.request.object.metadata.labels.app
    msg = sprintf("Pod %s must have 'app' label", [input.request.object.metadata.name])
}

# Deny if namespace doesn't have required labels
deny[msg] {
    input.request.kind.kind == "Namespace"
    not input.request.object.metadata.labels.name
    msg = sprintf("Namespace %s must have 'name' label", [input.request.object.metadata.name])
}

# Deny if ingress doesn't have required labels
deny[msg] {
    input.request.kind.kind == "Ingress"
    not input.request.object.metadata.labels.app
    msg = sprintf("Ingress %s must have 'app' label", [input.request.object.metadata.name])
}
