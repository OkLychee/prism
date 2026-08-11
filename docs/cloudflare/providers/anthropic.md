---
description: Route Anthropic API requests through AI Gateway for observability and control.
title: Anthropic
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Anthropic

Last updated Jul 28, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/anthropic/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[Anthropic ↗](https://www.anthropic.com/) helps build reliable, interpretable, and steerable AI systems.

## Endpoint

**Base URL**

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic
```

## Examples

### cURL

With API Key in Request

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic/v1/messages \
 --header 'x-api-key: {anthropic_api_key}' \
 --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
 --header 'anthropic-version: 2023-06-01' \
 --header 'Content-Type: application/json' \
 --data  '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "What is Cloudflare?"}
    ]
  }'
```

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic/v1/messages \
 --header 'x-api-key: {anthropic_api_key}' \
 --header 'anthropic-version: 2023-06-01' \
 --header 'Content-Type: application/json' \
 --data  '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "What is Cloudflare?"}
    ]
  }'
```

With Stored Keys (BYOK) / Unified Billing

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic/v1/messages \
 --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
 --header 'anthropic-version: 2023-06-01' \
 --header 'Content-Type: application/json' \
 --data  '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "What is Cloudflare?"}
    ]
  }'
```

### Anthropic SDK

With Key in Request

```js
import Anthropic from "@anthropic-ai/sdk";

const baseURL = `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/anthropic`;

const anthropic = new Anthropic({
	apiKey: "{ANTHROPIC_API_KEY}",
	baseURL,
	defaultHeaders: {
		Authorization: `Bearer {cf_api_token}`,
	},
});

const message = await anthropic.messages.create({
	model: "claude-sonnet-4-5",
	messages: [{ role: "user", content: "What is Cloudflare?" }],
	max_tokens: 1024,
});
```

```js
import Anthropic from "@anthropic-ai/sdk";

const baseURL = `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/anthropic`;

const anthropic = new Anthropic({
	apiKey: "{ANTHROPIC_API_KEY}",
	baseURL,
});

const message = await anthropic.messages.create({
	model: "claude-sonnet-4-5",
	messages: [{ role: "user", content: "What is Cloudflare?" }],
	max_tokens: 1024,
});
```

With Stored Keys (BYOK) / Unified Billing

```js
import Anthropic from "@anthropic-ai/sdk";

const baseURL = `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/anthropic`;

const anthropic = new Anthropic({
	apiKey: "placeholder", // Ignored by AI Gateway when using BYOK or Unified Billing, but the SDK requires a value.
	baseURL,
	defaultHeaders: {
		Authorization: `Bearer {cf_api_token}`,
	},
});

const message = await anthropic.messages.create({
	model: "claude-sonnet-4-5",
	messages: [{ role: "user", content: "What is Cloudflare?" }],
	max_tokens: 1024,
});
```

Note

When using BYOK or Unified Billing, do not set `x-api-key` in `defaultHeaders`. AI Gateway supplies the Anthropic key for you, and adding your own `x-api-key` header will cause the request to fail. The `apiKey` value in the example is a placeholder to satisfy the Anthropic SDK, which requires either the `apiKey` option or the `ANTHROPIC_API_KEY` environment variable to be set.

## OpenAI-Compatible Endpoint

You can also access Anthropic models using the OpenAI API schema through the [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/). Send your requests to:

```txt
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

Specify:

```json

{
	"model": "anthropic/{model}"
}
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/anthropic/#page","headline":"Anthropic · Cloudflare AI Gateway docs","description":"Route Anthropic API requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/anthropic/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-07-28","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
