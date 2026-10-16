{{/*
CareDesk helper templates - shared naming and labels.
*/}}
{{- define "caredesk.fullname" -}}
{{- printf "%s-%s" .Release.Name "caredesk" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "caredesk.labels" -}}
app.kubernetes.io/name: caredesk
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
