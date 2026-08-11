---
description: Route OpenAI API requests through AI Gateway for observability and control.
title: OpenAI
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# OpenAI

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/openai/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[OpenAI ↗](https://openai.com/about/) helps you build with GPT models.

## Endpoint

**Base URL**

```plaintext
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai
```

When making requests to OpenAI, replace `https://api.openai.com/v1` in the URL you are currently using with `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai`.

**Chat completions endpoint**

`https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions`

**Responses endpoint**

`https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/responses`

## Examples

### OpenAI SDK

With Key in Request

```js
import OpenAI from "openai";

const client = new OpenAI({
	apiKey: "YOUR_OPENAI_API_KEY",
	defaultHeaders: {
		"cf-aig-authorization": `Bearer {cf_api_token}`,
	},
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
});

const response = await client.chat.completions.create({
	model: "gpt-4o-mini",
	messages: [{ role: "user", content: "Hello, world!" }],
});
```

```js
import OpenAI from "openai";

const client = new OpenAI({
	apiKey: "YOUR_OPENAI_API_KEY",
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
});

const response = await client.chat.completions.create({
	model: "gpt-4o-mini",
	messages: [{ role: "user", content: "Hello, world!" }],
});
```

With Stored Keys (BYOK) / Unified Billing

```js
import OpenAI from "openai";

const client = new OpenAI({
	apiKey: "{cf_api_token}",
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
});

// Ensure your OpenAI API key is stored with BYOK
// or Unified Billing has credits
const response = await client.chat.completions.create({
	model: "gpt-4o-mini",
	messages: [{ role: "user", content: "Hello, world!" }],
});
```

### cURL

Responses API with API Key in Request

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/responses \
  --header 'Authorization: Bearer {OPENAI_API_KEY}' \
  --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{
  	"model": "gpt-5.1",
  	"input": [
    	{
      	"role": "user",
      	"content": "Write a one-sentence bedtime story about a unicorn."
    	}
  	]
  }'
```

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/responses \
  --header 'Authorization: Bearer {OPENAI_API_KEY}' \
  --header 'Content-Type: application/json' \
  --data '{
  	"model": "gpt-5.1",
  	"input": [
    	{
      	"role": "user",
      	"content": "Write a one-sentence bedtime story about a unicorn."
    	}
  	]
  }'
```

Chat Completions with API Key in Request

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  --header 'Authorization: Bearer {OPENAI_API_KEY}' \
  --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  --header 'Authorization: Bearer {OPENAI_API_KEY}' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

Responses API with Stored Keys (BYOK) / Unified Billing

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/responses \
  --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{
  	"model": "gpt-5.1",
  	"input": [
    	{
      	"role": "user",
      	"content": "Write a one-sentence bedtime story about a unicorn."
    	}
  	]
  }'
```

Chat Completions with Stored Keys (BYOK) / Unified Billing

```bash
curl -X POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/openai/#page","headline":"OpenAI · Cloudflare AI Gateway docs","description":"Route OpenAI API requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/openai/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
