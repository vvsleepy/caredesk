output "cluster_name" {
  description = "EKS cluster name."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint."
  value       = module.eks.cluster_endpoint
}

output "vpc_id" {
  description = "VPC id for the CareDesk network."
  value       = module.vpc.vpc_id
}

output "configure_kubectl" {
  description = "Command that points kubectl at the new cluster."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${var.cluster_name}"
}
