variable "aws_region" {
  description = "AWS region for the CareDesk infrastructure."
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster."
  type        = string
  default     = "caredesk-eks"
}

variable "environment" {
  description = "Environment label used in tags."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the CareDesk VPC."
  type        = string
  default     = "10.30.0.0/16"
}

variable "kubernetes_version" {
  description = "EKS control-plane Kubernetes version (standard support only, avoids extended-support fees)."
  type        = string
  default     = "1.34"
}
