#!/bin/bash
set -euo pipefail

# ---------------------------------------------------
# SAR KICT App Server 초기 설정 스크립트
# Ubuntu 24.04 LTS — Astro 정적 사이트 서빙
# ---------------------------------------------------

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------
# Swap 설정 (2GB) — t3.small OOM 방지
# ---------------------------------------------------
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # 메모리가 부족할 때만 swap 사용 (성능 유지)
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# 시스템 업데이트
apt-get update -y
apt-get upgrade -y

# 필수 패키지
apt-get install -y curl git nginx certbot python3-certbot-nginx

# ---------------------------------------------------
# Node.js 22 LTS 설치 (빌드용)
# ---------------------------------------------------
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# ---------------------------------------------------
# 앱 배포 디렉토리 준비
# ---------------------------------------------------
mkdir -p /var/www/sar-kict
chown ubuntu:ubuntu /var/www/sar-kict

# ---------------------------------------------------
# Nginx 설정 (Astro 정적 파일 직접 서빙)
# ---------------------------------------------------
cat > /etc/nginx/sites-available/sar-kict <<'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/sar-kict/dist;
    index index.html;

    # gzip 압축 (정적 사이트 성능 향상)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # 정적 에셋 캐시 (1년)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/sar-kict /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx
