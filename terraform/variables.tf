variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2" # Seoul
}

variable "vpc_id" {
  description = "기존 VPC ID (DB와 같은 VPC)"
  type        = string
  default     = "vpc-bd0d80d6"
}

variable "subnet_id" {
  description = "기존 Subnet ID (DB와 같은 서브넷 → 같은 AZ, 내부통신 무료)"
  type        = string
  default     = "subnet-dfd1b9a4"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "sar-kict3"
}

variable "allowed_ssh_cidrs" {
  description = "SSH 접근 허용 IP 대역 (본인 IP 권장)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "domain_name" {
  description = "Cloudflare에 등록된 도메인"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "sar-kict"
}
