#!/usr/bin/env bash
# ============================================================
# Veggio — Production Deploy Script
# Usage: EC2_IP=1.2.3.4 KEY=veggio-key.pem bash deploy.sh
# ============================================================
set -e

EC2_IP="${EC2_IP:?Set EC2_IP environment variable}"
KEY="${KEY:-veggio-key.pem}"
REMOTE="ubuntu@${EC2_IP}"
SSH="ssh -i ${KEY} -o StrictHostKeyChecking=accept-new"
RSYNC="rsync -avz --delete -e 'ssh -i ${KEY} -o StrictHostKeyChecking=accept-new'"

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}▶${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }

echo "🌿  Veggio Deploy → ${EC2_IP}"
echo "================================"

# Build frontend (outputs to backend/wwwroot)
info "Building React frontend..."
cd frontend
npm ci --silent
npm run build
cd ..
success "Frontend built → backend/wwwroot"

# Publish .NET backend
info "Publishing .NET 8 backend..."
cd backend
dotnet publish -c Release -o ./publish --nologo -v quiet
cd ..
success "Backend published → backend/publish"

# Upload to EC2
info "Uploading to EC2..."
eval "${RSYNC} backend/publish/ ${REMOTE}:/home/ubuntu/veggio/"
success "Files uploaded"

# Restart service
info "Restarting Veggio service..."
${SSH} ${REMOTE} "sudo systemctl restart veggio && sudo systemctl is-active veggio"
success "Service restarted"

echo ""
echo "✅  Deploy complete → https://$(${SSH} ${REMOTE} 'curl -s http://checkip.amazonaws.com' 2>/dev/null || echo ${EC2_IP})"
