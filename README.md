# Prism

[English](README.md) | [简体中文](README-zh_CN.md)

**Prism** is an edge-native LLM API Gateway and Candidate AI Coding Evaluation Platform built on **Cloudflare Workers**, **Hono**, **React**, **Cloudflare D1**, and **Cloudflare R2**.

It provides visual candidate evaluation, token quota management, and full prompt interaction timeline playback for technical AI Coding interviews. 100% runs on Cloudflare.

---

## Key Features

- **Edge-Native Architecture**: 100% runs on Cloudflare Workers edge network with zero server management & minimal latency.
- **Bi-directional Protocol Adapter**:
  - Standard `/openai/v1/chat/completions` and `/anthropic/v1/messages` endpoints.
  - Seamlessly transforms payloads, headers (`anthropic-version`), JSON responses, and SSE `TransformStream` events between OpenAI and Anthropic formats.
- **Flexible Provider Support**:
  - **Cloudflare Workers AI**: Native support for `@cf/*` free & cost-effective models with zero configuration.
  - **Cloudflare AI Gateway**: Supports Provider Native routing (OpenAI, Anthropic, Google AI Studio, Grok/xAI, OpenRouter) with Cloudflare Unified Billing or Cloudflare Hosted BYOK.
  - **Custom Provider (BYOK)**: Supports custom Base URLs and private API Keys.
- **Candidate Key & Quota Management**:
  - Easily set token limits, allowed model whitelists, and expiration dates for candidate API Keys.
  - Generates ready-to-send candidate invitation guides & CLI setup commands (Codex CLI, Claude Code, Cursor, Windsurf, Aider).
- **Prompt Timeline Playback & Evaluation**:
  - Visual timeline playback for interviewers to review candidates' prompt strategy, task decomposition, and AI interaction skills.

---

## Quick Start with GitHub Fork

If you want to quickly deploy your own Prism instance to Cloudflare Workers with zero hassle:

1. **Fork this repository** to your GitHub account.
2. Clone your forked repo:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/prism.git
   cd prism
   pnpm install
   ```
3. Copy `apps/gateway/wrangler.example.toml` to `apps/gateway/wrangler.toml` and set your Cloudflare D1 Database ID.
4. Run `pnpm dev` locally or `pnpm deploy` to deploy directly to your Cloudflare Workers edge account!

---

## Default Admin Credentials

> [!IMPORTANT]
> **Default Admin Login Credentials:**
> - **Username**: `admin`
> - **Password**: `admin123`
>
> ⚠️ **SECURITY WARNING**: Upon initial login or deploying to production, a compulsory security modal will prompt you to **change your password immediately**. Please set a strong custom password to secure your admin dashboard!

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (v9+)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Wrangler

Copy `wrangler.example.toml` in `apps/gateway`:

```bash
cp apps/gateway/wrangler.example.toml apps/gateway/wrangler.toml
```

Edit `apps/gateway/wrangler.toml` with your Cloudflare D1 Database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "prism-db"
database_id = "YOUR_CLOUDFLARE_D1_DATABASE_ID"
```

### 4. Local Database Migration

Apply D1 SQL migrations locally:

```bash
pnpm --filter @oklychee/prism-gateway db:migrate:local
```

### 5. Run Local Development

Start the gateway and frontend dashboard concurrently:

```bash
pnpm dev
```

The gateway will run locally at `http://localhost:8787` and dashboard at `http://localhost:5173`.

---

## 📦 Deployment

### 1. Create Remote Cloudflare Resources

Create a D1 database on Cloudflare:

```bash
npx wrangler d1 create prism-db
```

*(Optional)* Create an R2 bucket for persistent long prompt logs:

```bash
npx wrangler r2 bucket create prism-logs
```

### 2. Apply Remote Migrations

```bash
pnpm --filter @oklychee/prism-gateway db:migrate:remote
```

### 3. Build & Deploy to Cloudflare Workers

Build static SSG assets and deploy to Cloudflare:

```bash
pnpm build
pnpm --filter @oklychee/prism-gateway deploy
```

### 4. (Optional) Cloudflare Turnstile Anti-Brute-Force Guard

Prism has native, zero-friction support for Cloudflare Turnstile to prevent login brute-force attacks:

> [!NOTE]
> `VITE_TURNSTILE_SITE_KEY` is embedded into the frontend static assets at compile time. Make sure to set it in `apps/dashboard/.env` **before running `pnpm build`**.

1. Create a Turnstile widget on your [Cloudflare Dashboard](https://dash.cloudflare.com/) (Free).
2. Set your **Site Key** in `apps/dashboard/.env` **before building**:
   ```bash
   VITE_TURNSTILE_SITE_KEY="0x4AAAAAAA..."
   ```
3. Run `pnpm build` to compile the dashboard bundle with Turnstile enabled.
4. Set your **Secret Key** in `apps/gateway` secrets:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
*(If unconfigured, Turnstile verification is automatically disabled and will not block logins).*

---

## 📌 TODO / Roadmap

- [ ] Limit Candidate Key Usage by Spending Amount (USD Cost Limit)
- [ ] Multi-Interviewer Account & Role-Based Access Support
- [ ] Interview Problem Bank & Preset Challenges Management
- [ ] AI-Assisted Candidate Evaluation & Rating System

---

## 📄 License

MIT © [OKLYCHEE](https://oklychee.dev)
