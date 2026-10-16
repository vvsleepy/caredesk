# CareDesk AWS infrastructure (region ap-south-1 / Mumbai).
# Cost note: EKS + NAT gateway bill by the hour. Run terraform destroy
# as soon as the demo is over (see MY_STEPS.md cost-safety section).

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "caredesk"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
