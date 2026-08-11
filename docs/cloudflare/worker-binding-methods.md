---
description: Reference for the AI binding with AI Gateway. Call Workers AI and third-party models with env.AI.run(), access log IDs, and use gateway methods for feedback, logging, and URLs.
title: Workers Bindings
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Workers Bindings

Last updated Jun 12, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

The AI binding (`env.AI`) lets you call AI models and access AI Gateway features directly from your Worker.

For a step-by-step setup guide, refer to [Set up Workers AI with AI Gateway](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/).

## Configuration

Add an AI binding to your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

```jsonc
{
	"ai": {
		"binding": "AI",
	},
}
```

```toml
[ai]
binding = "AI"
```

The binding is accessible in your Worker code as `env.AI`.

If you're using TypeScript, run [wrangler types](https://developers.cloudflare.com/workers/wrangler/commands/general/#types) whenever you modify your Wrangler configuration file. This generates types for the `env` object based on your bindings, as well as [runtime types](https://developers.cloudflare.com/workers/languages/typescript/).

## `env.AI.run()`

Runs an inference request through AI Gateway. Accepts Workers AI models (`@cf/` prefix) and third-party models (`{author}/{model}` format).

**Workers AI model:**

```js
const resp = await env.AI.run(
	"@cf/moonshotai/kimi-k2.5",
	{
		prompt: "tell me a joke",
	},
	{
		gateway: {
			id: "default", // or use a specific gateway name
		},
	},
);
```

```ts
const resp = await env.AI.run(
	"@cf/moonshotai/kimi-k2.5",
	{
		prompt: "tell me a joke",
	},
	{
		gateway: {
			id: "default", // or use a specific gateway name
		},
	},
);
```

**Third-party model:**

```js
const resp = await env.AI.run(
	"openai/gpt-4.1-mini",
	{
		messages: [{ role: "user", content: "tell me a joke" }],
	},
	{
		gateway: {
			id: "default", // or use a specific gateway name
		},
	},
);
```

```ts
const resp = await env.AI.run(
	"openai/gpt-4.1-mini",
	{
		messages: [{ role: "user", content: "tell me a joke" }],
	},
	{
		gateway: {
			id: "default", // or use a specific gateway name
		},
	},
);
```

Third-party models require an AI Gateway and use [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/). Cloudflare manages the provider credentials and deducts credits from your account. You do not need to supply your own API keys.

Note

[BYOK (Bring Your Own Keys)](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/) is not supported for third-party models called through the AI binding. To use your own provider keys, use the [provider-native endpoints](https://developers.cloudflare.com/ai-gateway/usage/providers/) instead.

Browse available models in the [model catalog](https://developers.cloudflare.com/ai/models/).

### Gateway options

The third argument to `env.AI.run()` accepts a `gateway` object with the following parameters:

| Parameter  | Type    | Default    | Description                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id         | string  | _required_ | Name of your [AI Gateway](https://developers.cloudflare.com/ai-gateway/get-started/). Must be in the same account as your Worker. Use "default" to automatically create a gateway on the first authenticated request. Refer to [Default gateway](https://developers.cloudflare.com/ai-gateway/configuration/manage-gateway/#default-gateway) for details. |
| skipCache  | boolean | false      | Skip the [cache](https://developers.cloudflare.com/ai-gateway/features/caching/) for this request.                                                                                                                                                                                                                                                        |
| cacheTtl   | number  | —          | [Cache TTL](https://developers.cloudflare.com/ai-gateway/features/caching/) in seconds.                                                                                                                                                                                                                                                                   |
| cacheKey   | string  | —          | Custom [cache key](https://developers.cloudflare.com/ai-gateway/features/caching/) for this request.                                                                                                                                                                                                                                                      |
| collectLog | boolean | —          | Whether to [collect logs](https://developers.cloudflare.com/ai-gateway/observability/logging/) for this request.                                                                                                                                                                                                                                          |
| metadata   | object  | —          | [Custom metadata](https://developers.cloudflare.com/ai-gateway/observability/custom-metadata/) to attach to the log entry.                                                                                                                                                                                                                                |

## `env.AI.aiGatewayLogId`

Returns the log ID from the most recent `env.AI.run()` request.

```typescript
const myLogId = env.AI.aiGatewayLogId;
```

## `env.AI.gateway()`

Returns a gateway instance for accessing AI Gateway methods directly.

```typescript
const gateway = env.AI.gateway("my-gateway");
```

The gateway instance exposes the following methods.

### `patchLog()`

Sends feedback, score, and metadata for a specific log entry. All properties in the second argument are optional.

```typescript
await gateway.patchLog("my-log-id", {
	feedback: 1,
	score: 100,
	metadata: {
		user: "123",
	},
});
```

**Returns:** `Promise<void>`

### `getLog()`

Retrieves details of a specific log entry. If the `AiGatewayLog` type is missing, run [wrangler types](https://developers.cloudflare.com/workers/languages/typescript/#generate-types).

```typescript
const log = await gateway.getLog("my-log-id");
```

**Returns:** `Promise<AiGatewayLog>`

### `getUrl()`

Returns the base URL for your AI Gateway. Pass an optional provider name to get the provider-specific endpoint.

```typescript
const baseUrl = await gateway.getUrl();
// https://gateway.ai.cloudflare.com/v1/my-account-id/my-gateway/

const openaiUrl = await gateway.getUrl("openai");
// https://gateway.ai.cloudflare.com/v1/my-account-id/my-gateway/openai
```

**Parameters:** Optional `provider` (string or `AIGatewayProviders` enum)

**Returns:** `Promise<string>`

#### SDK integration examples

**OpenAI SDK:**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: "my api key", // defaults to process.env["OPENAI_API_KEY"]
	baseURL: await env.AI.gateway("my-gateway").getUrl("openai"),
});
```

**Vercel AI SDK with OpenAI:**

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
	baseURL: await env.AI.gateway("my-gateway").getUrl("openai"),
});
```

**Vercel AI SDK with Anthropic:**

```typescript
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
	baseURL: await env.AI.gateway("my-gateway").getUrl("anthropic"),
});
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/#page","headline":"Workers Bindings · Cloudflare AI Gateway docs","description":"Reference for the AI binding with AI Gateway. Call Workers AI and third-party models with env.AI.run(), access log IDs, and use gateway methods for feedback, logging, and URLs.","url":"https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-06-12","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"},"keywords":["AI","Bindings"]}
```
