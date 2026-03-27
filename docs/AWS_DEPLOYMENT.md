# Veggio — AWS Free Tier Deployment Guide
## Complete Step-by-Step

---

## Architecture Overview

```
Internet → Route 53 (DNS) → EC2 t2.micro (Nginx reverse proxy)
                                 ↓
                          ASP.NET Core 8 API
                          React (static, served by Nginx)
                                 ↓
                          RDS PostgreSQL t3.micro (free tier)
```

**AWS Free Tier services used:**
- EC2 t2.micro (750 hrs/month free)
- RDS PostgreSQL db.t3.micro (750 hrs/month free)
- S3 (5GB free for images/backups)
- CloudWatch (10 metrics, 5GB logs free)
- Route 53 (if needed, $0.50/hosted zone/month — minimal cost)

---

## Step 1: Set Up AWS Account

1. Go to https://aws.amazon.com → **Create a Free Account**
2. Enter credit card (required but won't be charged within free tier)
3. Choose **Support plan: Basic (free)**
4. Enable **MFA** on root account immediately
5. Create an **IAM user** (don't use root for daily work):
   - IAM → Users → Add User → name: `veggio-admin`
   - Attach policy: `AdministratorAccess`
   - Save the Access Key ID and Secret

---

## Step 2: Launch EC2 Instance

1. **EC2 → Instances → Launch Instance**
2. **Name:** `veggio-server`
3. **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
4. **Instance type:** `t2.micro` ← Free tier
5. **Key pair:**
   - Create new → name: `veggio-key`
   - Download `veggio-key.pem` — keep it safe!
6. **Security Group (Firewall):**
   - Create new: `veggio-sg`
   - Add rules:
     ```
     SSH    (22)   — Your IP only (not 0.0.0.0/0!)
     HTTP   (80)   — Anywhere (0.0.0.0/0, ::/0)
     HTTPS  (443)  — Anywhere (0.0.0.0/0, ::/0)
     ```
7. **Storage:** 8 GiB gp2 (free tier)
8. **Launch Instance**

**Connect to your instance:**
```bash
chmod 400 veggio-key.pem
ssh -i veggio-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Set Up RDS PostgreSQL

1. **RDS → Create database**
2. **Engine:** PostgreSQL 15
3. **Templates:** **Free tier** ← Important!
4. **DB instance identifier:** `veggio-db`
5. **Master username:** `veggio_user`
6. **Master password:** Generate a strong password (save it!)
7. **Instance class:** `db.t3.micro` ← Free tier
8. **Storage:** 20 GiB gp2, disable autoscaling
9. **Connectivity:**
   - Don't connect to EC2 automatically (do it manually below)
   - VPC: Default VPC
   - Public access: **No**
   - VPC security group: Create new `rds-veggio-sg`
10. **Create database**

**Allow EC2 to connect to RDS:**
```
RDS Security Group → Inbound rules → Add rule:
Type: PostgreSQL (5432)
Source: veggio-sg (your EC2 security group)
```

**Get RDS endpoint:** RDS → Databases → veggio-db → Connectivity & security → Endpoint

---

## Step 4: Configure EC2 Server

SSH into your EC2 instance, then run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install .NET 8
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0
echo 'export PATH=$PATH:$HOME/.dotnet' >> ~/.bashrc
echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.bashrc
source ~/.bashrc

# Install Node.js 20 (for building frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot (free SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install PostgreSQL client (for running schema.sql)
sudo apt install -y postgresql-client
```

---

## Step 5: Configure Environment Secrets

```bash
# Create environment file (NEVER commit this to git)
sudo mkdir -p /etc/veggio
sudo nano /etc/veggio/environment

# Paste these values (replace with your real values):
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=YOUR_RDS_ENDPOINT;Port=5432;Database=veggio;Username=veggio_user;Password=YOUR_DB_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=GENERATE_A_STRONG_64_CHAR_RANDOM_KEY_HERE
Jwt__Issuer=https://yourdomain.com
Jwt__Audience=https://yourdomain.com
AllowedOrigins=https://yourdomain.com

# Secure the file
sudo chmod 600 /etc/veggio/environment
sudo chown root:root /etc/veggio/environment
```

**Generate a strong JWT key:**
```bash
openssl rand -base64 48
# Copy the output as your Jwt__Key
```

---

## Step 6: Initialize the Database

```bash
# Connect to RDS and create database
psql -h YOUR_RDS_ENDPOINT -U veggio_user -d postgres

# In the psql shell:
CREATE DATABASE veggio;
\c veggio
# Paste the contents of docs/schema.sql here
\q
```

---

## Step 7: Deploy the Application

**On your local machine — build and upload:**
```bash
# Build React frontend
cd frontend
npm install
npm run build
# This outputs to ../backend/wwwroot

# Publish .NET backend
cd ../backend
dotnet publish -c Release -o ./publish

# Upload to EC2
rsync -avz --exclude='.git' \
  -e "ssh -i veggio-key.pem" \
  ./publish/ ubuntu@YOUR_EC2_IP:/home/ubuntu/veggio/
```

**On EC2:**
```bash
# Create systemd service for auto-restart
sudo nano /etc/systemd/system/veggio.service
```

Paste:
```ini
[Unit]
Description=Veggio ASP.NET Core API
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/veggio
ExecStart=/home/ubuntu/.dotnet/dotnet /home/ubuntu/veggio/Veggio.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=veggio
User=ubuntu
EnvironmentFile=/etc/veggio/environment

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable veggio
sudo systemctl start veggio
sudo systemctl status veggio   # should show "active (running)"
```

---

## Step 8: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/veggio
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

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

        # Rate limit API
        limit_req zone=api burst=20 nodelay;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }

    # Serve static React files
    location / {
        root /home/ubuntu/veggio/wwwroot;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Long cache for hashed assets
    location ~* \.(js|css|png|jpg|ico|woff2?)$ {
        root /home/ubuntu/veggio/wwwroot;
        expires 1y;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
```

```bash
sudo ln -s /etc/nginx/sites-available/veggio /etc/nginx/sites-enabled/
sudo nginx -t                # test config
sudo systemctl reload nginx
```

---

## Step 9: Set Up Free SSL with Let's Encrypt

```bash
# Point your domain to EC2 IP first (DNS A record)
# Then run:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts — choose to redirect HTTP to HTTPS
# Certificate auto-renews every 90 days
sudo systemctl enable certbot.timer
```

---

## Step 10: Set Up S3 for Image Storage (Optional)

```bash
# Create S3 bucket
aws s3 mb s3://veggio-images --region us-east-1

# Set bucket policy for public read on images:
aws s3api put-bucket-policy --bucket veggio-images --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::veggio-images/*"
  }]
}'
```

When creating vegetables, set imageUrl to:
`https://veggio-images.s3.amazonaws.com/filename.jpg`

---

## Step 11: Monitoring & Alerts

**CloudWatch Alarm — high CPU:**
```
CloudWatch → Alarms → Create Alarm
Metric: EC2 → Per-Instance → CPUUtilization
Threshold: > 80% for 5 minutes
Action: SNS email notification
```

**Check application logs:**
```bash
sudo journalctl -u veggio -f      # live app logs
sudo tail -f /var/log/nginx/error.log
```

---

## Step 12: Auto-Deploy Script

Save as `deploy.sh` on your local machine:
```bash
#!/bin/bash
set -e

echo "Building frontend..."
cd frontend && npm install && npm run build && cd ..

echo "Publishing backend..."
cd backend && dotnet publish -c Release -o ./publish && cd ..

echo "Uploading..."
rsync -avz --delete \
  -e "ssh -i veggio-key.pem" \
  backend/publish/ \
  ubuntu@YOUR_EC2_IP:/home/ubuntu/veggio/

echo "Restarting service..."
ssh -i veggio-key.pem ubuntu@YOUR_EC2_IP "sudo systemctl restart veggio"

echo "Deploy complete!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Security Checklist

- [ ] EC2 SSH access limited to your IP only
- [ ] RDS not publicly accessible  
- [ ] Strong JWT secret (64+ chars, random)
- [ ] Strong DB password (20+ chars)
- [ ] Environment file owned by root, permissions 600
- [ ] SSL certificate installed (HTTPS)
- [ ] Nginx security headers configured
- [ ] Rate limiting on API endpoints
- [ ] Logs monitored via CloudWatch
- [ ] MFA enabled on AWS root account

---

## Cost Estimate (AWS Free Tier, first 12 months)

| Service           | Free Tier         | Cost |
|-------------------|-------------------|------|
| EC2 t2.micro      | 750 hrs/month     | $0   |
| RDS db.t3.micro   | 750 hrs/month     | $0   |
| S3                | 5 GB storage      | $0   |
| Data transfer     | 1 GB/month out    | $0   |
| Route 53          | Not free          | $0.50/zone |
| **Total**         |                   | **~$0.50/month** |

After 12 months: ~$25–35/month for the same setup.

---

## Admin Account

Default admin credentials (change immediately after first login!):
- Email: `admin@veggio.io`  
- Password: `Admin@123`

Change via the Profile page or directly in PostgreSQL:
```sql
UPDATE users 
SET password_hash = '$2a$12$...' -- generate with BCrypt
WHERE email = 'admin@veggio.io';
```
