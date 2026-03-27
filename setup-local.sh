#!/usr/bin/env bash
# ============================================================
# Veggio — Local Development Setup Script
# Run from the project root: bash setup-local.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "🌿  Veggio Local Setup"
echo "=============================="
echo ""

# Check prerequisites
command -v node  >/dev/null 2>&1 || error "Node.js 20+ required. Install from https://nodejs.org"
command -v dotnet>/dev/null 2>&1 || error ".NET 8 SDK required. Install from https://dot.net"
command -v psql  >/dev/null 2>&1 || warn  "psql not found — manual DB setup required"

NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
[ "$NODE_VER" -lt 18 ] && error "Node.js 18+ required (found $(node -v))"

DOTNET_VER=$(dotnet --version | cut -d. -f1)
[ "$DOTNET_VER" -lt 8 ] && error ".NET 8+ required (found $(dotnet --version))"

success "Prerequisites OK"
echo ""

# ── Frontend ──────────────────────────────────────────────
info "Installing frontend dependencies..."
cd frontend
npm install
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  success "Created frontend/.env.local"
else
  warn "frontend/.env.local already exists — skipping"
fi
cd ..
success "Frontend ready"
echo ""

# ── Backend secrets ───────────────────────────────────────
info "Configuring backend secrets..."
cd backend

# Generate a secure JWT key
JWT_KEY=$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64)

dotnet user-secrets init --project Veggio.Api.csproj 2>/dev/null || true
dotnet user-secrets set "Jwt:Key" "$JWT_KEY"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=veggio;Username=postgres;Password=postgres"

success "Backend secrets configured (JWT key auto-generated)"
warn "Update the DB connection string in: dotnet user-secrets list"
cd ..
echo ""

# ── Database ──────────────────────────────────────────────
if command -v psql >/dev/null 2>&1; then
  info "Setting up PostgreSQL database..."
  psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'veggio'" | \
    grep -q 1 && warn "Database 'veggio' already exists" || \
    psql -U postgres -c "CREATE DATABASE veggio;" && success "Database 'veggio' created"
  
  info "Running EF Core migrations..."
  cd backend
  dotnet tool install --global dotnet-ef 2>/dev/null || true
  dotnet ef database update && success "Migrations applied (seed data included)"
  cd ..
else
  warn "psql not found — run these manually:"
  echo "  1. createdb veggio"
  echo "  2. cd backend && dotnet ef database update"
fi
echo ""

# ── Done ──────────────────────────────────────────────────
echo "=============================="
success "Setup complete!"
echo ""
echo "To start development:"
echo "  Terminal 1 (backend):  cd backend && dotnet run"
echo "  Terminal 2 (frontend): cd frontend && npm run dev"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:5000/api"
echo "  Admin:    http://localhost:3000/admin"
echo "  Login:    admin@veggio.io / Admin@123"
echo ""
