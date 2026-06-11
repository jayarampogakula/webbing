# VPS Installation Guide

This guide provides step-by-step instructions to deploy Webbing on a Virtual Private Server (VPS) running Ubuntu/Debian.

---

## 🐋 Option 1: Docker Compose (Recommended)
Docker Compose is the fastest way to boot the entire environment (Web App, Worker, PostgreSQL, and Redis) in fully isolated containers.

### 1. Install Docker & Docker Compose
Run the following commands on your VPS:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Clone the Repository
Clone the code onto your VPS:
```bash
git clone https://github.com/jayarampogakula/webbing.git
cd webbing
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
nano .env
```
Fill in the database connections, Redis URLs, Stripe keys, and LLM provider credentials.

### 4. Deploy and Boot
Start the containers in detached mode:
```bash
docker-compose up -d --build
```
This starts:
* **web**: The Next.js web application running on port `3000`.
* **worker**: The background BullMQ queue consumer handler.
* **postgres**: A local PostgreSQL database running on port `5432` (if database is host-local).
* **redis**: A local Redis server on port `6379`.

---

## 🛠️ Option 2: Manual / PM2 Deployment
If you prefer not to use Docker, you can run the services using Node.js and PM2.

### 1. Install Prerequisites
Install Node.js 20, PostgreSQL, Redis, and PM2 globally:
```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -y pm2 -g

# Install PostgreSQL & Redis
sudo apt install -y postgresql redis-server
sudo systemctl start postgresql redis-server
```

### 2. Configure Database & Environment
1. Log in to PostgreSQL and create a database:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE webbing;"
   ```
2. Clone the repository and configure `.env`:
   ```bash
   git clone https://github.com/jayarampogakula/webbing.git
   cd webbing
   cp .env.example .env
   nano .env
   ```
   Ensure `DATABASE_URL` matches your local Postgres credentials (e.g. `postgresql://postgres:PASSWORD@localhost:5432/webbing`).

### 3. Install Dependencies & Build
Install workspaces dependencies and compile:
```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate database clients & run migrations
npm run db:generate
npx prisma db push --schema=packages/db/prisma/schema.prisma

# Seed initial database configs
node packages/db/prisma/seed.js

# Build production bundles
npm run build
```

### 4. Start with PM2
Launch the Next.js app and the BullMQ background worker as active background services:
```bash
# Start Next.js Web App
pm2 start "npm run start -w webbing-web" --name "webbing-web"

# Start Background Job Worker
pm2 start "node packages/worker/dist/index.js" --name "webbing-worker"

# Save PM2 process list to load on reboot
pm2 save
pm2 startup
```

---

## 🔒 Wildcard Subdomain & Domain Routing Setup
To support instant subdomain generation (e.g., `user-site.yourdomain.com`), you need:
1. **DNS Settings**: Add a wildcard A record pointing to your VPS IP:
   * **Host**: `*`
   * **Value**: `VPS_IP_ADDRESS`
2. **Reverse Proxy (Nginx / Caddy)**: Config Nginx to pass requests to `http://localhost:3000` while preserving the host header so Next.js can identify subdomains:
   ```nginx
   server {
       listen 80;
       server_name .yourdomain.com; # Dot prefix includes wildcards

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
