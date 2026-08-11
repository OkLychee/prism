---
description: Call third-party and Workers AI models through the Cloudflare API with AI Gateway features like logging, caching, and rate limiting.
title: REST API
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# REST API

Last updated Jun 29, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/rest-api/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

The REST API lets you call any model — whether hosted on Cloudflare or by a third-party provider like OpenAI, Anthropic, or Google — through the same Cloudflare API, with all AI Gateway features — logging, caching, rate limiting, and more — applied automatically.

No provider SDKs or API keys are needed. Authentication and billing are handled through your Cloudflare account. Third-party models are billed via [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/), while Workers AI models follow [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Endpoints

Four endpoints are available, each suited to different use cases:

| Endpoint                     | Format                     | Use case                                         | Third-Party Models | Workers AI Models (@cf/) |
| ---------------------------- | -------------------------- | ------------------------------------------------ | ------------------ | ------------------------ |
| POST /ai/run                 | Envelope with model, input | All models and modalities (LLM, image, TTS, ASR) | ✅ Yes              | ✅ Yes                    |
| POST /ai/v1/chat/completions | OpenAI chat completions    | LLMs — OpenAI SDK compatible                     | ✅ Yes              | ✅ Yes                    |
| POST /ai/v1/responses        | OpenAI Responses API       | Agentic workflows — OpenAI SDK compatible        | ✅ Yes              | ✅ Model dependent        |
| POST /ai/v1/messages         | Anthropic Messages API     | LLMs — Anthropic SDK compatible                  | ✅ Yes              | ❌ No                     |

Note

The `/ai/v1/messages` endpoint strictly uses Anthropic's API schema and supports routing to Anthropic and other third-party models. Workers AI models (`@cf/`) do not support this schema. Use `/ai/run` or `/ai/v1/chat/completions` for Workers AI models, or `/ai/v1/responses` only for Workers AI models that support the Responses API, such as GPT-OSS.

## Authentication

Authenticate with a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) that has `AI Gateway` permission. Pass it in the `Authorization` header.

Note

Ensure your Cloudflare account has [sufficient credits loaded](https://developers.cloudflare.com/ai-gateway/features/unified-billing/#load-credits) before calling third-party models.

## Model naming

Third-party models use the `author/model` format:

* `openai/gpt-4.1` — OpenAI
* `anthropic/claude-sonnet-4` — Anthropic
* `google/gemini-3-flash` — Google
* `xai/grok-3` — xAI

Workers AI models use the `@cf/author/model` format (for example, `@cf/moonshotai/kimi-k2.6`). Workers AI requests also require the `cf-aig-gateway-id` header — refer to [Call a Workers AI model](#call-a-workers-ai-model) for details.

Browse available models in the [model catalog](https://developers.cloudflare.com/ai/models/).

## `/ai/run` — universal endpoint

Accepts any model with its per-model schema. Model-specific parameters go inside `input`.

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "openai/gpt-4.1",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": "What is Cloudflare?"
        }
      ],
      "max_tokens": 512
    }
  }'
```

### Call a Workers AI model

To call a Workers AI model, use the `@cf/` prefix in the model name and include the `cf-aig-gateway-id` header to specify which gateway to route through.

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "cf-aig-gateway-id: default" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "@cf/moonshotai/kimi-k2.6",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": "What is Cloudflare?"
        }
      ]
    }
  }'
```

The existing Workers AI endpoint with the model ID in the URL path also continues to work:

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/moonshotai/kimi-k2.6" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

## `/ai/v1/chat/completions` — OpenAI compatible

Uses the standard OpenAI chat completions format. The `model` field uses the same `author/model` naming. This endpoint is compatible with the OpenAI SDK and other OpenAI-compatible clients.

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "openai/gpt-4.1",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ],
    "max_tokens": 512,
    "temperature": 0.7,
    "stream": true
  }'
```

### OpenAI SDK

Point the OpenAI SDK `baseURL` at the Cloudflare API:

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: CLOUDFLARE_API_TOKEN,
	baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1`,
});

const response = await openai.chat.completions.create({
	model: "openai/gpt-4.1",
	messages: [{ role: "user", content: "What is Cloudflare?" }],
});
```

## `/ai/v1/responses` — OpenAI Responses API

Uses the OpenAI Responses API format for agentic workflows. Compatible with the OpenAI SDK.

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: CLOUDFLARE_API_TOKEN,
	baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1`,
});

const response = await openai.responses.create({
	model: "openai/gpt-4.1",
	input: "What is Cloudflare?",
});
```

## `/ai/v1/messages` — Anthropic compatible

Uses the Anthropic Messages API format. Compatible with the Anthropic SDK.

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/messages" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "anthropic/claude-sonnet-4-5",
    "max_tokens": 512,
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

Point the Anthropic SDK `baseURL` at the Cloudflare API:

```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
	apiKey: CLOUDFLARE_API_TOKEN,
	baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1`,
});

const message = await anthropic.messages.create({
	model: "anthropic/claude-sonnet-4-5",
	max_tokens: 512,
	messages: [{ role: "user", content: "What is Cloudflare?" }],
});
```

## Provider tools and web search

Some providers expose native tools — including server-side web search — through these endpoints. Refer to [Web Search](https://developers.cloudflare.com/ai-gateway/usage/web-search/) for the supported models per provider and the request shape each one uses. Browse the [model catalog](https://developers.cloudflare.com/ai/models/) for canonical model IDs.

## Specify a gateway

By default, third-party model requests route through your account's default AI Gateway. To use a specific gateway, include the `cf-aig-gateway-id` header. Workers AI requests always require this header.

```bash
# Run `wrangler whoami` to get your account ID to replace $CLOUDFLARE_ACCOUNT_ID,
# and `wrangler auth token` to get an auth token to replace $CLOUDFLARE_API_TOKEN.
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "cf-aig-gateway-id: default" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Hello"
      }
    ]
  }'
```

With the OpenAI SDK, set the header via `defaultHeaders`:

```javascript
const openai = new OpenAI({
	apiKey: CLOUDFLARE_API_TOKEN,
	baseURL: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/v1`,
	defaultHeaders: {
		"cf-aig-gateway-id": "default",
	},
});
```

All AI Gateway features configured on that gateway — caching, rate limiting, guardrails, and logging — apply to the request.

## Per-request configuration

Use `cf-aig-*` headers to control AI Gateway behavior on a per-request basis:

| Header                 | Type        | Description                                       |
| ---------------------- | ----------- | ------------------------------------------------- |
| cf-aig-skip-cache      | boolean     | Skip the cache for this request.                  |
| cf-aig-cache-ttl       | number      | Cache TTL in seconds.                             |
| cf-aig-cache-key       | string      | Custom cache key.                                 |
| cf-aig-collect-log     | boolean     | Turn logging on or off for this request.          |
| cf-aig-request-timeout | number      | Request timeout in milliseconds.                  |
| cf-aig-max-attempts    | number      | Retry attempts (max 5).                           |
| cf-aig-retry-delay     | number      | Retry delay in milliseconds (max 5000).           |
| cf-aig-backoff         | string      | Backoff method: constant, linear, or exponential. |
| cf-aig-metadata        | JSON string | Custom metadata to attach to the log entry.       |

For more details on these options, refer to [Request handling](https://developers.cloudflare.com/ai-gateway/configuration/request-handling/) and [Caching](https://developers.cloudflare.com/ai-gateway/features/caching/).

## Related resources

* [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) — load credits and pay for inference requests with a single Cloudflare bill.
* [Workers AI binding](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/) — call models from within a Cloudflare Worker using `env.AI.run()`.
* [Model catalog](https://developers.cloudflare.com/ai/models/) — browse models supported by the REST API.

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/rest-api/#page","headline":"REST API · Cloudflare AI Gateway docs","description":"Call third-party and Workers AI models through the Cloudflare API with AI Gateway features like logging, caching, and rate limiting.","url":"https://developers.cloudflare.com/ai-gateway/usage/rest-api/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-06-29","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"},"keywords":["AI"]}
```
