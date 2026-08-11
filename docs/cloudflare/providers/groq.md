---
description: Route Groq API requests through AI Gateway for observability and control.
title: Groq
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Groq

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/groq/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[Groq ↗](https://groq.com/) delivers high-speed processing and low-latency performance.

## Endpoint

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/groq
```

## URL structure

When making requests to [Groq ↗](https://groq.com/), replace `https://api.groq.com/openai/v1` in the URL you're currently using with `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/groq`.

## Prerequisites

When making requests to Groq, ensure you have the following:

* Your AI Gateway Account ID.
* Your AI Gateway gateway name.
* An active Groq API token.
* The name of the Groq model you want to use.

## Examples

### cURL

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/groq/chat/completions \
  --header 'Authorization: Bearer {groq_api_key}' \
  --header 'Content-Type: application/json' \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ],
    "model": "llama3-8b-8192"
}'
```

### Use Groq SDK with JavaScript

If using the [groq-sdk ↗](https://www.npmjs.com/package/groq-sdk), set your endpoint like this:

```js
import Groq from "groq-sdk";

const apiKey = env.GROQ_API_KEY;
const accountId = "{account_id}";
const gatewayId = "{gateway_id}";
const baseURL = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/groq`;

const groq = new Groq({
	apiKey,
	baseURL,
});

const messages = [{ role: "user", content: "What is Cloudflare?" }];
const model = "llama3-8b-8192";

const chatCompletion = await groq.chat.completions.create({
	messages,
	model,
});
```

## OpenAI-Compatible Endpoint

You can also access Groq models using the OpenAI API schema through the [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/). Send your requests to:

```txt
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

Specify:

```json

{
"model": "groq/{model}"
}
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/groq/#page","headline":"Groq · Cloudflare AI Gateway docs","description":"Route Groq API requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/groq/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
