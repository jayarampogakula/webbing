# Webbing: Enterprise-Grade AI Website Builder SaaS

Webbing is a production-grade, multi-tenant AI Website Builder SaaS similar to Wix AI, Durable, and Framer AI. It allows users to describe their business in a prompt, automatically orchestrates dynamic copy and page section structures using OpenAI, Claude, or Gemini, compiles the website, and publishes it instantly to custom domains with automatic SSL termination.

---

## 🚀 Key Features

* **Multi-Tenant SaaS Foundation**: Complete tenant isolation, SaaS pricing subscription mapping, and credit-based usage metering.
* **AI Website Generation**: Multi-page site builder pipeline (layout generator, copywriting generator, theme injector, SEO optimizer).
* **Dynamic Domain System**: Instant subdomain routing and on-demand TLS SSL certificate creation for client custom domains.
* **Background Worker Processing**: BullMQ job scheduler running on Redis to handle heavy AI operations asynchronously.
* **Modern SaaS Web Interface**: Built on Next.js 14, Tailwind CSS, and Prisma ORM.

---

## 🛠️ Tech Stack

* **Frontend/Backend**: Next.js App Router (TypeScript)
* **Database**: PostgreSQL (Prisma ORM)
* **Caching & Queue**: Redis + BullMQ
* **Deployment**: Docker, Docker Compose, Coolify-ready

---

## 💻 Local Development

### Prerequisites
* Node.js >= 20.x
* PostgreSQL and Redis running locally (or via Docker)

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/jayarampogakula/webbing.git
   cd webbing
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root folder:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webbing?schema=public"
   REDIS_URL="redis://localhost:6379"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   OPENAI_API_KEY="sk-proj-..."
   ANTHROPIC_API_KEY="sk-ant-..."
   GEMINI_API_KEY="AIzaSy..."
   ```

3. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Generate database Client**:
   ```bash
   npm run db:generate
   ```

5. **Start Dev Mode**:
   ```bash
   npm run dev
   ```
   This boots the Next.js app on `http://localhost:3000` and the BullMQ background worker concurrently.

---

## 📦 VPS Deployment (Docker Compose)

Deploy directly to your VPS using Docker Compose. A pre-configured load-balancer routing proxy setup is ready:

```bash
# Clone and configure environment variables
cp .env.example .env
nano .env

# Start containers
docker-compose up -d --build
```
This launches Next.js Web App, Background Job Worker, Redis, and PostgreSQL instances.
For details on wildcard routing, dynamic TLS configs, and performance optimization, refer to `docker/prod` and the architecture spec.
