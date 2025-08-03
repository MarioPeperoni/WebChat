#!/bin/bash
# Set strict mode
set -eux

# Install docker and nginx
yum update -y
yum install -y docker nginx

# Enable and start services
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

# Get credentials for ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 215012652815.dkr.ecr.eu-north-1.amazonaws.com

# Pull and run
docker pull 215012652815.dkr.ecr.eu-north-1.amazonaws.com/webchat-server:latest
docker run -d --name webchat-backend -p 8000:8000 215012652815.dkr.ecr.eu-north-1.amazonaws.com/webchat-server:latest

# Configure Nginx to reverse proxy to the backend
cat > /etc/nginx/conf.d/webchat.conf << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Restart nginx to apply the new configuration
systemctl restart nginx