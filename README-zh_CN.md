# Prism

[English](README.md) | [简体中文](README-zh_CN.md)

**Prism** 是基于 **Cloudflare Workers**、**Hono**、**React**、**Cloudflare D1** 和 **Cloudflare R2** 构建的边缘原生大语言模型 (LLM) API 网关与求职者 AI Coding 能力评估平台。

它专为技术面试场景打造，提供求职者 AI 交互的可视化评估、Token 额度管控以及完整的 Prompt 交互轨迹回放。100% 运行在 Cloudflare 之上。

---

## 核心特性

- **边缘原生架构**：100% 运行在 Cloudflare Workers 边缘网络上，无服务器运维负担，拥有极低的响应延迟。
- **双向协议适配器 (Bi-directional Protocol Adapter)**：
  - 原生提供标准 `/openai/v1/chat/completions` 与 `/anthropic/v1/messages` 接口。
  - 自动处理 OpenAI 与 Anthropic 格式之间的 Payload 请求转换、请求头 (`anthropic-version`) 透传、JSON 响应转换以及 SSE `TransformStream` 实时流事件转换。
- **灵活的供应商支持 (Provider Factory)**：
  - **Cloudflare Workers AI**：原生支持运行 `@cf/*` 免费与高性价比模型矩阵，免配置即刻体验。
  - **Cloudflare AI Gateway**：支持 Provider Native 托管路由（OpenAI, Anthropic, Google AI Studio, Grok/xAI, OpenRouter），支持 Cloudflare 统一计费或 Cloudflare 托管 BYOK。
  - **自定义供应商 (BYOK)**：支持配置自建/第三方 Base URL 与私有 API Key。
- **候选人密钥与额度管控**：
  - 快捷为求职者限制 Token 消耗总量、允许调用的模型白名单及失效到期时间。
  - 自动生成可直接复制发送的求职者邀请函与 CLI 配置指引（支持 Codex CLI, Claude Code, Cursor, Windsurf, Aider 等）。
- **交互轨迹回放与可视化评估**：
  - 时间线呈现求职者 Agent 的所有请求与响应，供面试官分析求职者的 Prompt 提问质量、任务拆解能力与 AI 协作水平。

---

## 通过 GitHub Fork 极速上手

如果您希望零门槛部署属于您自己的 Prism 实例：

1. **Fork 本仓库** 到您的 GitHub 账户。
2. 克隆您 Fork 后的仓库：
   ```bash
   git clone https://github.com/<您的用户名>/prism.git
   cd prism
   pnpm install
   ```
3. 复制 `apps/gateway/wrangler.example.toml` 为 `apps/gateway/wrangler.toml` 并配置您的 Cloudflare D1 数据库 ID。
4. 在本地运行 `pnpm dev` 预览或使用 `pnpm deploy` 一键部署至您的 Cloudflare Workers 账号！

---

## 默认管理员账号

> [!IMPORTANT]
> **系统默认管理员登录凭据：**
> - **用户名**：`admin`
> - **初始密码**：`admin123`
>
> ⚠️ **重要安全警告**：在首次登录系统或部署至生产环境时，系统会**强制弹出修改密码弹窗**。请务必在第一时间修改为您自己的强密码，以确保管理后台与数据安全！

---

## 🚀 快速上手

### 1. 环境准备

- [Node.js](https://nodejs.org/) (建议 v18+)
- [pnpm](https://pnpm.io/) (建议 v9+)

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 Wrangler

复制 `apps/gateway/wrangler.example.toml` 为 `apps/gateway/wrangler.toml`：

```bash
cp apps/gateway/wrangler.example.toml apps/gateway/wrangler.toml
```

编辑 `apps/gateway/wrangler.toml` 并配置您的 Cloudflare D1 数据库 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "prism-db"
database_id = "YOUR_CLOUDFLARE_D1_DATABASE_ID"
```

### 4. 本地数据库迁移

向本地开发环境应用 D1 SQL 迁移脚本：

```bash
pnpm --filter @oklychee/prism-gateway db:migrate:local
```

### 5. 本地开发启动

启动网关与前端控制台（支持 Concurrent 协同运行）：

```bash
pnpm dev
```

网关服务将在本地 `http://localhost:8787` 运行，控制台将在 `http://localhost:5173` 运行。

---

## 📦 线上部署

### 1. 创建远程 Cloudflare 资源

在 Cloudflare 平台上创建一个 D1 数据库：

```bash
npx wrangler d1 create prism-db
```

*(可选)* 创建一个用于保存日志的 R2 Bucket：

```bash
npx wrangler r2 bucket create prism-logs
```

### 2. 执行远程数据库迁移

```bash
pnpm --filter @oklychee/prism-gateway db:migrate:remote
```

### 3. 构建与部署至 Cloudflare Workers

构建 SSG 静态预渲染产物并部署网关至 Cloudflare：

```bash
pnpm build
pnpm --filter @oklychee/prism-gateway deploy
```

### 4. (可选) Cloudflare Turnstile 防暴力破解验证

Prism 原生支持一键接入 Cloudflare Turnstile 验证码，有效防御管理后台密码暴力猜解：

> [!NOTE]
> `VITE_TURNSTILE_SITE_KEY` 会在编译期直接打包注入至前端产物中。请务必在**执行 `pnpm build` 前**完成 `.env` 配置文件写入。

1. 在 [Cloudflare 控制台](https://dash.cloudflare.com/) 免费创建一个 Turnstile Widget。
2. 在 **打包编译之前**，于 `apps/dashboard/.env` 中配置您的 **Site Key**（公钥）：
   ```bash
   VITE_TURNSTILE_SITE_KEY="0x4AAAAAAA..."
   ```
3. 执行 `pnpm build` 进行打包预渲染。
4. 在 `apps/gateway` 中注入您的 **Secret Key**（私钥）：
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
*(如不配置密钥，系统会自动关闭 Turnstile 拦截，不影响正常登录流程)。*

---

## 📌 TODO / 未来规划

- [ ] 支持按美元消费额度限制候选人 Key
- [ ] 多面试官账号支持
- [ ] 面试题管理
- [ ] AI 辅助智能评估

---

## 📄 开源协议

MIT © [OKLYCHEE](https://oklychee.dev)
