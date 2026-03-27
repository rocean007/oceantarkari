# 🌿 Veggio — Complete Setup, Local Dev & AWS Hosting Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [Understanding the Project Structure](#4-understanding-the-project-structure)
5. [Running & Testing Locally](#5-running--testing-locally)
6. [AWS Free Tier Hosting — Step by Step](#6-aws-free-tier-hosting--step-by-step)
7. [Domain & SSL Setup](#7-domain--ssl-setup)
8. [Deploying Updates](#8-deploying-updates)
9. [Monitoring & Logs](#9-monitoring--logs)
10. [Troubleshooting Common Issues](#10-troubleshooting-common-issues)
11. [Security Checklist](#11-security-checklist)
12. [Admin Panel Usage](#12-admin-panel-usage)
13. [Cost Breakdown](#13-cost-breakdown)

---

## 1. Project Overview

Veggio is a full-stack vegetable ordering platform:

```
┌─────────────────────────────────────────────────────────┐
│                    TECH STACK                           │
├──────────────┬──────────────────────────────────────────┤
│  Frontend    │  React 18 + Vite + React Query           │
│  Backend     │  C# ASP.NET Core 8 (.NET 8)              │
│  Database    │  PostgreSQL 15                           │
│  Auth        │  JWT (HS256, stored in sessionStorage)   │
│  Hosting     │  AWS EC2 t2.micro + RDS db.t3.micro      │
│  Web Server  │  Nginx (reverse proxy + static files)    │
│  SSL         │  Let's Encrypt (free, auto-renews)       │
└──────────────┴──────────────────────────────────────────┘
```

**What works out of the box:**
- Browse vegetables with search, filters, sorting
- Product detail pages
- Add to cart, cart drawer, full cart page
- Register / Login (JWT auth)
- Checkout with address + payment method selection
- Order history + cancel pending orders
- Admin panel: manage vegetables, view orders, update status, view users
- Skeleton loading screens on every data fetch
- Fully responsive (mobile-first)
- Dark mode (follows OS preference)

---

## 2. Prerequisites

### For Local Development

| Tool | Version | Install Link |
|------|---------|-------------|
| Node.js | 20+ | https://nodejs.org |
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| PostgreSQL | 15+ | https://www.postgresql.org/download |
| Git | Any | https://git-scm.com |

**Check you have the right versions:**
```bash
node --version       # should be v20+
dotnet --version     # should be 8.x.x
psql --version       # should be 15+
```

### For AWS Hosting

- AWS account (free tier): https://aws.amazon.com/free
- A domain name (optional but recommended — e.g. Namecheap ~$10/yr)
- Your local machine running macOS, Linux, or WSL2 on Windows

---

## 3. Local Development Setup

### Step 1 — Unzip the project

```bash
unzip veggio.zip
cd veggio
```

### Step 2 — Set up the database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql:
CREATE DATABASE veggio;
CREATE USER veggio_user WITH PASSWORD 'localpassword123';
GRANT ALL PRIVILEGES ON DATABASE veggio TO veggio_user;
\q
```

### Step 3 — Configure backend secrets

Never put secrets in `appsettings.json`. Use .NET's user secrets tool instead:

```bash
cd backend

# Initialize user secrets store
dotnet user-secrets init

# Set your database connection
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=veggio;Username=veggio_user;Password=localpassword123"

# Generate and set a JWT key (must be 32+ characters)
dotnet user-secrets set "Jwt:Key" "my-super-secret-dev-key-change-in-production-please"
dotnet user-secrets set "Jwt:Issuer" "http://localhost:5000"
dotnet user-secrets set "Jwt:Audience" "http://localhost:3000"

# Confirm secrets are saved
dotnet user-secrets list
```

### Step 4 — Run database migrations

This creates all tables and seeds the admin user + 10 sample vegetables:

```bash
# Still inside backend/
# Install EF Core CLI tool (one-time)
dotnet tool install --global dotnet-ef

# Apply migrations (creates tables + seed data)
dotnet ef database update

# You should see: "Done."
```

### Step 5 — Configure frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local

# .env.local already has: VITE_API_URL=http://localhost:5000/api
# No changes needed for local dev
```

### Step 6 — Start both servers

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
dotnet run

# You should see:
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: http://localhost:5000
# info: Microsoft.Hosting.Lifetime[0]
#       Application started.
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev

# You should see:
#   VITE v5.x.x  ready in Xms
#   ➜  Local:   http://localhost:3000/
```

### Step 7 — Open in browser

| URL | What you see |
|-----|-------------|
| `http://localhost:3000` | Customer storefront |
| `http://localhost:3000/shop` | Vegetable listings |
| `http://localhost:3000/admin` | Admin panel (login required) |
| `http://localhost:5000/health` | API health check (returns `Healthy`) |

**Default admin login:**
- Email: `admin@veggio.io`
- Password: `Admin@123`

> ⚠️ Change this password immediately after your first login.

---

## 4. Understanding the Project Structure

```
veggio/
│
├── frontend/                          # React application (Vite)
│   ├── index.html                     # HTML entry point
│   ├── vite.config.js                 # Build config, proxy to backend
│   ├── package.json                   # Dependencies
│   └── src/
│       ├── main.jsx                   # App entry, providers setup
│       ├── App.jsx                    # Routes definition
│       │
│       ├── assets/styles/
│       │   ├── tokens.css             # ← ALL design tokens (colors, spacing, fonts)
│       │   ├── global.css             # Reset + base styles
│       │   └── skeleton.css           # Shimmer animation
│       │
│       ├── context/
│       │   ├── AuthContext.jsx        # Login state, JWT management
│       │   ├── CartContext.jsx        # Cart items, quantities, totals
│       │   └── ToastContext.jsx       # Notification toasts
│       │
│       ├── lib/
│       │   └── api.js                 # Axios instance + all API helpers
│       │
│       ├── components/
│       │   ├── auth/AuthModal         # Sign in / Register modal
│       │   ├── layout/
│       │   │   ├── Navbar             # Top navigation bar
│       │   │   ├── Footer             # Site footer
│       │   │   ├── Layout             # Wraps public pages
│       │   │   └── AdminLayout        # Wraps admin pages (role-gated)
│       │   ├── shop/
│       │   │   ├── VeggieCard         # Product card with add-to-cart
│       │   │   └── CartDrawer         # Slide-in cart panel
│       │   └── skeleton/
│       │       └── PageSkeleton       # All skeleton loading components
│       │
│       └── pages/
│           ├── Home.jsx               # Hero + bento categories + featured
│           ├── Shop.jsx               # Filterable product grid
│           ├── Product.jsx            # Single product detail
│           ├── Cart.jsx               # Full cart page
│           ├── Checkout.jsx           # Address + payment form
│           ├── Orders.jsx             # Order history
│           ├── Profile.jsx            # Edit profile
│           ├── NotFound.jsx           # 404 page
│           └── admin/
│               ├── Dashboard.jsx      # Stats, recent orders
│               ├── Vegetables.jsx     # Add / edit / delete vegetables
│               ├── Orders.jsx         # All orders + status updates
│               └── Users.jsx          # Registered users list
│
├── backend/                           # ASP.NET Core 8 API
│   ├── Program.cs                     # ← App bootstrap (read this first)
│   ├── Veggio.Api.csproj              # NuGet packages
│   ├── appsettings.json               # Config (NO secrets here)
│   ├── appsettings.Production.json    # Production config template
│   │
│   ├── Models/Models.cs               # User, Vegetable, Order, OrderItem
│   ├── Data/AppDbContext.cs           # EF Core + PostgreSQL + seed data
│   ├── DTOs/DTOs.cs                   # Request/response shapes
│   ├── Services/TokenService.cs       # JWT generation
│   ├── Middleware/Middleware.cs        # Security headers + error handling
│   └── Controllers/
│       ├── AuthController.cs          # POST /api/auth/register|login, GET /api/auth/me
│       ├── VegetablesController.cs    # GET /api/vegetables, POST|PUT|DELETE (admin)
│       ├── OrdersController.cs        # POST /api/orders, GET /api/orders
│       └── AdminController.cs         # GET /api/admin/stats|orders|users
│
└── docs/
    ├── schema.sql                     # Raw PostgreSQL DDL (alternative to EF migrations)
    └── AWS_DEPLOYMENT.md              # Detailed AWS guide
```

### How the frontend and backend talk

```
React (port 3000)
      │
      │  npm run dev → Vite proxy
      │  /api/* → http://localhost:5000/api/*
      ▼
ASP.NET Core (port 5000)
      │
      │  EF Core
      ▼
PostgreSQL (port 5432)
```

In production, Nginx handles all routing — no ports exposed directly.

---

## 5. Running & Testing Locally

### Test the API directly

```bash
# Health check
curl http://localhost:5000/health

# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@1234"}'

# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veggio.io","password":"Admin@123"}'
# Copy the "token" value from the response

# List vegetables (public)
curl http://localhost:5000/api/vegetables

# List vegetables with filters
curl "http://localhost:5000/api/vegetables?category=leafy&sort=price_asc"

# Search vegetables
curl "http://localhost:5000/api/vegetables?search=broccoli"

# Create a vegetable (admin only — use the token from login)
curl -X POST http://localhost:5000/api/vegetables \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Veg","category":"Leafy","price":50,"unit":"kg","stock":100}'

# Place an order (need customer token)
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"vegetableId":"aaaaaaaa-0001-0000-0000-000000000000","quantity":2}],
    "deliveryAddress":"123 Test Street, Kathmandu",
    "phone":"9800000000",
    "paymentMethod":"cod"
  }'
```

### Check the database directly

```bash
psql -U veggio_user -d veggio

# See all vegetables
SELECT name, category, price, stock FROM vegetables;

# See all users
SELECT name, email, role FROM users;

# See all orders
SELECT id, status, total FROM orders;

# Exit
\q
```

### Common development tasks

```bash
# Add a new EF migration after changing models
cd backend
dotnet ef migrations add YourMigrationName
dotnet ef database update

# Reset the database completely (WARNING: deletes all data)
dotnet ef database drop --force
dotnet ef database update

# Check for build errors
dotnet build

# Run with hot reload
dotnet watch run

# Build the frontend for production
cd frontend
npm run build
# Output goes to backend/wwwroot/ (served by ASP.NET)
```

---

## 6. AWS Free Tier Hosting — Step by Step

> **Estimated time:** 45–90 minutes for first setup  
> **Cost:** ~$0/month for 12 months, ~$0.50/month after (just Route 53)

### Step 1 — Create AWS Account

1. Go to https://aws.amazon.com → **Create a Free Account**
2. Enter your email, password, account name
3. Choose **Personal** account type
4. Enter credit card (required, won't charge within free tier limits)
5. Phone verification → choose **Basic Support (Free)**
6. Log in to the AWS Console

**Immediately secure your account:**
```
Top right → Your name → Security credentials
→ Multi-factor authentication (MFA)
→ Assign MFA device → Authenticator app
→ Follow the steps with Google Authenticator or Authy
```

**Create an IAM user (don't use root for daily work):**
```
Search "IAM" → Users → Create user
Name: veggio-admin
Check: "Provide user access to the AWS Management Console"
Permissions: Attach policies directly → AdministratorAccess
Create user → Download .csv (save the credentials!)
```

Log out of root, log back in as your IAM user.

---

### Step 2 — Launch EC2 Instance

1. Search **EC2** in the top search bar → **Launch instance**

2. Fill in:
   ```
   Name:           veggio-server
   AMI:            Ubuntu Server 22.04 LTS (Free tier eligible) ← important
   Instance type:  t2.micro ← Free tier eligible
   ```

3. **Key pair:**
   ```
   → Create new key pair
   Name: veggio-key
   Type: RSA
   Format: .pem (macOS/Linux) or .ppk (Windows PuTTY)
   → Create key pair (downloads automatically)
   ```
   
   **Save `veggio-key.pem` somewhere safe — you cannot re-download it!**

4. **Network settings → Edit:**
   ```
   Security group name: veggio-sg
   
   Add these rules:
   ┌──────────┬──────────┬─────────────────────────────┐
   │ Type     │ Port     │ Source                      │
   ├──────────┼──────────┼─────────────────────────────┤
   │ SSH      │ 22       │ My IP (click dropdown)      │
   │ HTTP     │ 80       │ Anywhere (0.0.0.0/0, ::/0)  │
   │ HTTPS    │ 443      │ Anywhere (0.0.0.0/0, ::/0)  │
   └──────────┴──────────┴─────────────────────────────┘
   
   IMPORTANT: SSH must be your IP only, not 0.0.0.0/0
   ```

5. **Configure storage:** 8 GiB gp2 (default is fine)

6. Click **Launch instance**

7. Wait ~2 minutes → click your instance → copy **Public IPv4 address**

---

### Step 3 — Launch RDS PostgreSQL

1. Search **RDS** → **Create database**

2. Fill in:
   ```
   Creation method:    Standard create
   Engine:             PostgreSQL
   Version:            PostgreSQL 15.x
   Templates:          Free tier ← CLICK THIS
   
   DB instance identifier: veggio-db
   Master username:        veggio_user
   Master password:        YourStr0ngP@ssword (save this!)
   Confirm password:       (same)
   
   Instance class:     db.t3.micro ← Free tier
   Storage:            20 GiB, gp2
   Disable storage autoscaling ← uncheck it
   
   Connectivity:
     VPC:            Default VPC
     Public access:  No ← important, keeps DB private
     VPC security group: Create new → name: rds-veggio-sg
   
   Database name (in Additional config): veggio
   ```

3. Click **Create database** — takes 5–10 minutes

4. Once created: click `veggio-db` → copy the **Endpoint** 
   (looks like: `veggio-db.xxxx.us-east-1.rds.amazonaws.com`)

**Allow EC2 to reach RDS:**
```
RDS → veggio-db → Connectivity & security → VPC security groups
→ Click rds-veggio-sg → Inbound rules → Edit inbound rules → Add rule:
  Type: PostgreSQL
  Port: 5432
  Source: Custom → type "veggio" → select veggio-sg (the EC2 security group)
→ Save rules
```

---

### Step 4 — Connect to EC2 & Install Software

```bash
# On your LOCAL machine:

# Make the key file readable only by you (required by SSH)
chmod 400 veggio-key.pem

# Connect to your server
ssh -i veggio-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# You should see: ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

Now you're on the server. Run these commands:

```bash
# Update everything first
sudo apt update && sudo apt upgrade -y

# Install .NET 8
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0 --runtime aspnetcore
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
echo 'export PATH=$PATH:$HOME/.dotnet:$HOME/.dotnet/tools' >> ~/.bashrc
source ~/.bashrc

# Verify .NET installed
dotnet --version   # should print 8.x.x

# Install Node.js 20 (for building frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x

# Install Nginx
sudo apt install -y nginx

# Install Certbot for free SSL
sudo apt install -y certbot python3-certbot-nginx

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Verify you can connect to RDS
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d veggio -c "\l"
# Enter your RDS password when prompted
# You should see the database list
```

---

### Step 5 — Upload and Configure the Application

**On your LOCAL machine** (new terminal window, don't close the SSH one):

```bash
cd veggio

# Build the frontend (outputs to backend/wwwroot)
cd frontend && npm install && npm run build && cd ..

# Publish the .NET backend
cd backend
dotnet publish -c Release -o ./publish
cd ..

# Upload to EC2
rsync -avz --progress \
  -e "ssh -i veggio-key.pem" \
  backend/publish/ \
  ubuntu@YOUR_EC2_IP:/home/ubuntu/veggio/

echo "Upload complete"
```

**Back on the EC2 server** (your SSH terminal):

```bash
# Create the secrets/environment file
sudo mkdir -p /etc/veggio
sudo nano /etc/veggio/environment
```

Paste this (replace ALL placeholder values):

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://localhost:5000
ConnectionStrings__DefaultConnection=Host=YOUR_RDS_ENDPOINT;Port=5432;Database=veggio;Username=veggio_user;Password=YOUR_RDS_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=PASTE_YOUR_64_CHARACTER_RANDOM_KEY_HERE
Jwt__Issuer=https://yourdomain.com
Jwt__Audience=https://yourdomain.com
Jwt__ExpiryHours=12
AllowedOrigins=https://yourdomain.com
```

**Generate a strong JWT key (run this, copy the output):**
```bash
openssl rand -base64 48
```

Save the file: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Lock down the secrets file
sudo chmod 600 /etc/veggio/environment
sudo chown root:root /etc/veggio/environment

# Verify it looks correct
sudo cat /etc/veggio/environment
```

---

### Step 6 — Initialize the Database

```bash
# Connect to RDS and run the schema
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d veggio \
  -f /home/ubuntu/veggio/docs/schema.sql

# Or do it manually:
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d veggio

# Inside psql, run the EF Core migrations instead.
# The app will auto-migrate on startup because of this line in Program.cs:
# await db.Database.MigrateAsync();
# So you can skip this step — just start the app and it'll handle it.
\q
```

---

### Step 7 — Set Up the systemd Service

This makes your app start automatically and restart on crashes:

```bash
sudo nano /etc/systemd/system/veggio.service
```

Paste exactly:

```ini
[Unit]
Description=Veggio ASP.NET Core 8 API
After=network.target
Wants=network-online.target

[Service]
Type=notify
WorkingDirectory=/home/ubuntu/veggio
ExecStart=/home/ubuntu/.dotnet/dotnet /home/ubuntu/veggio/Veggio.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=veggio
User=ubuntu
Group=ubuntu
EnvironmentFile=/etc/veggio/environment
TimeoutStartSec=60

[Install]
WantedBy=multi-user.target
```

Save and exit: `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable veggio
sudo systemctl start veggio

# Check it's running (should say "active (running)")
sudo systemctl status veggio

# See live logs
sudo journalctl -u veggio -f
# Press Ctrl+C to stop watching

# Test the API is responding
curl http://localhost:5000/health
# Should return: Healthy
```

---

### Step 8 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/veggio
```

Paste (replace `yourdomain.com`):

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=auth_zone:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api_zone:10m rate=100r/m;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    # Certbot will add HTTPS redirect here automatically

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml text/javascript;

    # API proxy
    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 10s;

        # Rate limit API
        limit_req zone=api_zone burst=20 nodelay;
    }

    # Stricter rate limit for auth endpoints
    location /api/auth/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        limit_req zone=auth_zone burst=5 nodelay;
    }

    # Health check (no rate limit)
    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }

    # Static React files (served directly by Nginx for speed)
    root /home/ubuntu/veggio/wwwroot;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache hashed JS/CSS forever (Vite adds content hashes)
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Cache images for 30 days
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }
}
```

```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/veggio /etc/nginx/sites-enabled/

# Remove the default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config for syntax errors
sudo nginx -t
# Should say: "syntax is ok" and "test is successful"

# Apply the config
sudo systemctl reload nginx

# Test it works (use your EC2 IP for now, before domain setup)
curl http://YOUR_EC2_IP/health
```

---

## 7. Domain & SSL Setup

### Point your domain to EC2

In your domain registrar (Namecheap, GoDaddy, etc.):

```
Type: A
Host: @
Value: YOUR_EC2_PUBLIC_IP
TTL: 300

Type: A
Host: www
Value: YOUR_EC2_PUBLIC_IP
TTL: 300
```

Wait 5–30 minutes for DNS to propagate. Test with:
```bash
dig +short yourdomain.com    # should return your EC2 IP
```

### Install free SSL certificate

```bash
# Get certificate (replace with your actual domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# When asked:
# Email: your-email@example.com
# Agree to terms: Y
# Share email with EFF: N (optional)
# Redirect HTTP to HTTPS: 2 (yes, always redirect)

# Certbot auto-modifies your nginx config to add HTTPS
# Verify HTTPS works
curl https://yourdomain.com/health

# Set up auto-renewal (certbot renews every 90 days)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal works
sudo certbot renew --dry-run
```

### Update your app secrets for the real domain

```bash
sudo nano /etc/veggio/environment

# Update these lines:
Jwt__Issuer=https://yourdomain.com
Jwt__Audience=https://yourdomain.com
AllowedOrigins=https://yourdomain.com

# Restart the app
sudo systemctl restart veggio
```

---

## 8. Deploying Updates

Every time you change code, run this on your **local machine**:

```bash
cd veggio

# Option A: Manual steps
cd frontend && npm run build && cd ..
cd backend && dotnet publish -c Release -o ./publish && cd ..

rsync -avz --delete \
  -e "ssh -i veggio-key.pem" \
  backend/publish/ \
  ubuntu@YOUR_EC2_IP:/home/ubuntu/veggio/

ssh -i veggio-key.pem ubuntu@YOUR_EC2_IP \
  "sudo systemctl restart veggio && sudo systemctl is-active veggio"

echo "Deploy complete!"


# Option B: Use the included deploy script
EC2_IP=YOUR_IP KEY=veggio-key.pem bash deploy.sh
```

### Zero-downtime consideration

The t2.micro has limited RAM. If you need zero downtime:
1. Build on local, upload
2. `sudo systemctl reload veggio` instead of `restart` 
   (ASP.NET Core handles graceful shutdown)

---

## 9. Monitoring & Logs

### Application logs

```bash
# Live log stream (Ctrl+C to stop)
sudo journalctl -u veggio -f

# Last 100 lines
sudo journalctl -u veggio -n 100

# Logs from today
sudo journalctl -u veggio --since today

# Logs between times
sudo journalctl -u veggio --since "2025-01-01 10:00" --until "2025-01-01 11:00"

# Error logs only
sudo journalctl -u veggio -p err
```

### Nginx logs

```bash
# Live access log
sudo tail -f /var/log/nginx/access.log

# Live error log
sudo tail -f /var/log/nginx/error.log
```

### Server health

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# API health endpoint
curl https://yourdomain.com/health

# Check the app is running
sudo systemctl status veggio
```

### AWS CloudWatch (optional but recommended)

```
AWS Console → CloudWatch → Alarms → Create alarm
Metric: EC2 → Per-Instance Metrics → CPUUtilization
Instance: your veggio-server instance
Threshold: Greater than 80 for 5 minutes
Actions: Create SNS topic → your email
```

This sends you an email if CPU spikes unexpectedly.

---

## 10. Troubleshooting Common Issues

### "502 Bad Gateway" on the website

The .NET app crashed or hasn't started yet.

```bash
# Check the app status
sudo systemctl status veggio

# See recent errors
sudo journalctl -u veggio -n 50

# Common causes:
# 1. Wrong DB connection string
# 2. JWT key too short (must be 32+ chars)
# 3. App can't reach RDS (check security group rules)

# Restart after fixing
sudo systemctl restart veggio
```

### "Connection refused" to database

```bash
# Test connection from EC2 to RDS
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d veggio -c "SELECT 1"

# If it hangs/fails, check:
# 1. RDS security group allows port 5432 from EC2's security group
# 2. RDS instance is running (AWS Console → RDS → check status)
# 3. Connection string has correct endpoint/password
```

### App starts but shows blank page

```bash
# Check the frontend was built and uploaded
ls /home/ubuntu/veggio/wwwroot/

# Should contain: index.html, assets/

# If empty, re-run the build and upload steps:
# Local: cd frontend && npm run build
# Then rsync the publish folder again
```

### "Invalid email or password" even with correct credentials

```bash
# Check if seed data was applied
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d veggio \
  -c "SELECT email, role FROM users;"

# If no users exist, check migrations ran:
sudo journalctl -u veggio | grep -i "migration\|seed\|error"
```

### Free tier alert — you might get charged

Check your usage is within free tier limits:
```
AWS Console → Billing → Free Tier Usage
```

Most common over-limit: RDS running 24/7 past free hours.
Free tier gives 750 hrs/month — one instance uses exactly 744 hrs/month, so you're fine with ONE db.t3.micro.

### EC2 IP changes after restart

Free tier EC2 instances get a NEW public IP every time they stop/start.

Fix: Allocate an **Elastic IP** (free while attached to a running instance):
```
EC2 → Elastic IPs → Allocate Elastic IP address → Allocate
→ Actions → Associate Elastic IP → Select your instance → Associate
```

Now update your DNS A record to the Elastic IP.

---

## 11. Security Checklist

Before going live, verify each of these:

- [ ] SSH port 22 restricted to your IP only (not 0.0.0.0/0)
- [ ] RDS not publicly accessible (Public access: No)
- [ ] `/etc/veggio/environment` owned by root, permissions 600
- [ ] JWT key is 48+ characters and randomly generated
- [ ] Database password is 20+ characters with mixed chars
- [ ] HTTPS is working (`https://` not `http://`)
- [ ] Admin password changed from `Admin@123`
- [ ] MFA enabled on your AWS root account
- [ ] MFA enabled on your IAM user
- [ ] CloudWatch alarm set for high CPU
- [ ] Certbot auto-renewal configured
- [ ] No secrets committed to Git (check `.gitignore`)

---

## 12. Admin Panel Usage

Access: `https://yourdomain.com/admin`

Login with admin credentials.

### Managing Vegetables

1. Go to **Admin → Vegetables**
2. Click **+ Add Vegetable**
3. Fill in: Name, Category, Price (Rs.), Unit, Stock quantity
4. Optional: Description, Nutrition Info, Image URL, mark as Organic/Featured
5. Click **Add Vegetable** — it appears on the shop immediately

**To edit:** click **Edit** on any row  
**To remove:** click **Delete** → confirm → it's soft-deleted (hidden from shop, data preserved)

### Managing Orders

1. Go to **Admin → Orders**
2. Filter by status: All / Pending / Confirmed / Processing / Delivered / Cancelled
3. Change any order's status using the dropdown in the last column
4. Status flow: `Pending → Confirmed → Processing → Delivered`

### Dashboard

Shows:
- Total orders count
- Revenue today (vs. yesterday %)
- Active registered users
- Low stock count (items with fewer than 10 units)
- Recent 10 orders table

---

## 13. Cost Breakdown

### During AWS Free Tier (first 12 months)

| Service | Free Tier Limit | Your Usage | Cost |
|---------|----------------|------------|------|
| EC2 t2.micro | 750 hrs/month | ~744 hrs | **$0** |
| RDS db.t3.micro | 750 hrs/month | ~744 hrs | **$0** |
| RDS storage | 20 GB | 20 GB | **$0** |
| S3 | 5 GB | Minimal | **$0** |
| Data transfer out | 1 GB/month | Variable | **$0** |
| Route 53 (if used) | Not free | 1 zone | **$0.50** |
| **Monthly total** | | | **~$0.50** |

### After free tier expires (month 13+)

| Service | Approx Cost |
|---------|------------|
| EC2 t2.micro | ~$8.50/month |
| RDS db.t3.micro | ~$13.00/month |
| RDS storage (20GB) | ~$2.30/month |
| Data transfer | ~$1–3/month |
| Route 53 | $0.50/month |
| **Total** | **~$25–28/month** |

**To stay cheap after free tier:**
- Stop RDS when not in use (for dev/test setups)
- Use RDS Serverless v2 (pay per use) for low-traffic sites
- Move to a $6/month VPS (DigitalOcean/Hetzner) + managed Postgres

---

*Built with ❤️ using React, ASP.NET Core 8, and PostgreSQL*
