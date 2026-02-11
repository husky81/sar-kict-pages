#!/bin/bash
set -euo pipefail

# ---------------------------------------------------
# SAR KICT App Server 초기 설정 스크립트
# Ubuntu 24.04 LTS
# ---------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

# 시스템 업데이트
apt-get update -y
apt-get upgrade -y

# 필수 패키지
apt-get install -y curl git nginx certbot python3-certbot-nginx

# ---------------------------------------------------
# Node.js 22 LTS 설치
# ---------------------------------------------------
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# PM2 (프로세스 매니저)
npm install -g pm2

# ---------------------------------------------------
# 앱 배포 디렉토리 준비
# ---------------------------------------------------
mkdir -p /var/www/sar-kict
chown ubuntu:ubuntu /var/www/sar-kict

# ---------------------------------------------------
# Nginx 설정 (리버스 프록시 → Next.js :3000)
# ---------------------------------------------------
cat > /etc/nginx/sites-available/sar-kict <<'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sar-kict /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# ---------------------------------------------------
# PM2 자동 시작 설정
# ---------------------------------------------------
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
