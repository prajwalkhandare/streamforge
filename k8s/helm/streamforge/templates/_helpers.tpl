# k8s/helm/streamforge/templates/_helpers.tpl

{{- define "streamforge.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "streamforge.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "streamforge.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "streamforge.labels" -}}
helm.sh/chart: {{ include "streamforge.chart" . }}
{{ include "streamforge.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "streamforge.selectorLabels" -}}
app.kubernetes.io/name: {{ include "streamforge.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "streamforge.backend.labels" -}}
{{ include "streamforge.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "streamforge.frontend.labels" -}}
{{ include "streamforge.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}
