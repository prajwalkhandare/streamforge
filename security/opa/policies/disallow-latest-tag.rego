# OPA Policy: Disallow Latest Image Tag
# Location: security/opa/policies/disallow-latest-tag.rego
# Purpose: Prevent using ':latest' tag in container images

package kubernetes.admission

# Deny any container using :latest tag
deny[msg] {
    input.request.kind.kinds == ["Deployment", "StatefulSet", "DaemonSet", "Pod", "Job", "CronJob"]
    container := input.request.object.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg = sprintf("Container '%v' uses image with tag 'latest' which is not allowed. Use specific version tag.", [container.name])
}

# Deny initContainers using :latest tag
deny[msg] {
    input.request.kind.kinds == ["Deployment", "StatefulSet", "DaemonSet", "Pod", "Job", "CronJob"]
    container := input.request.object.spec.template.spec.initContainers[_]
    endswith(container.image, ":latest")
    msg = sprintf("InitContainer '%v' uses image with tag 'latest' which is not allowed. Use specific version tag.", [container.name])
}

# Deny if image doesn't have any tag (defaults to latest)
deny[msg] {
    input.request.kind.kinds == ["Deployment", "StatefulSet", "DaemonSet", "Pod", "Job", "CronJob"]
    container := input.request.object.spec.template.spec.containers[_]
    not contains(container.image, ":")
    msg = sprintf("Container '%v' uses image without a tag. Use specific version tag like 'v1.2.3' or '1.2.3'", [container.name])
}

# Warning for using :latest in annotations (informational)
warn[msg] {
    input.request.kind.kinds == ["Deployment", "StatefulSet", "DaemonSet"]
    container := input.request.object.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg = sprintf("⚠️ Warning: Container '%v' uses 'latest' tag. This is risky for production.", [container.name])
}