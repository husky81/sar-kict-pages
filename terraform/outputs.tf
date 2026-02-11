output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic IP (Cloudflare DNS A record에 이 IP를 등록)"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "SSH 접속 명령어"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.app.public_ip}"
}

output "security_group_id" {
  description = "App Security Group ID (회원 EC2 생성 시 참조)"
  value       = aws_security_group.app.id
}
