# System Requirements

This document outlines the hardware, software, and dependency requirements to run the Webbing SaaS platform.

## 💻 Hardware Requirements
* **Minimum Host**: 1 vCPU, 2 GB RAM (for lightweight workloads and testing)
* **Recommended Host**: 2 vCPUs, 4 GB RAM (with Swap space enabled if running Redis, Postgres, worker processes, and Next.js on the same node)
* **Storage**: 10 GB+ SSD space (highly dependent on database and self-hosted site storage)

---

## 🛠️ Software Requirements
* **Operating System**: Linux (Ubuntu 20.04 LTS or newer recommended, Debian, CentOS), macOS, or Windows (via WSL2 or native powershell/cmd)
* **Node.js**: `v20.x` or newer (Long Term Support)
* **NPM**: `v10.x` or newer
* **Database**: PostgreSQL `14` or newer (Prisma client pre-configured)
* **Message Queue & Cache**: Redis `6.2` or newer (used for BullMQ background workers and jobs tracking)

---

## 🔑 External API Requirements
To utilize the full AI site generation capabilities, you will need active developer API keys from one or more of the following:

1. **OpenAI**: An active API Key with access to GPT-4o / GPT-3.5 models.
2. **Anthropic Claude**: An API Key with access to Claude 3.5 Sonnet / Claude 3 Opus models.
3. **Google Gemini**: An API Key with access to Gemini 1.5 Pro / Flash models.
4. **Stripe**: Developer account keys (Secret Key and Webhook Secret) to handle subscription checkouts and billing events (optional if billing is manual/offline payments).
5. **SMTP Mail Server**: Credentials (Host, Port, User, Password) to dispatch system invitations, password resets, and payout confirmations.
