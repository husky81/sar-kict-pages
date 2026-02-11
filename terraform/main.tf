terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------
# 최신 Ubuntu 24.04 LTS AMI
# ---------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ---------------------------------------------------
# Security Group (기존 VPC에 생성)
# ---------------------------------------------------
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  description = "SAR KICT App Server"
  vpc_id      = var.vpc_id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Next.js dev (optional, 개발 시에만)
  ingress {
    description = "Next.js dev"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-app-sg"
    Project = var.project_name
  }
}

# ---------------------------------------------------
# EC2 Instance (DB와 같은 VPC/Subnet → 내부통신 무료)
# ---------------------------------------------------
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.app.id]
  subnet_id              = var.subnet_id

  root_block_device {
    volume_size = 30 # GB
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = file("${path.module}/user-data.sh")

  tags = {
    Name    = "${var.project_name}-app"
    Project = var.project_name
  }
}

# ---------------------------------------------------
# Elastic IP (고정 IP - Cloudflare DNS에 연결)
# ---------------------------------------------------
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}
