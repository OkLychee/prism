---
description: Route Baseten model inference requests through AI Gateway for observability and control.
title: Baseten
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Baseten

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/baseten/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[Baseten ↗](https://www.baseten.co/) provides infrastructure for building and deploying machine learning models at scale. Baseten offers access to various language models through a unified chat completions API.

## Endpoint

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/baseten
```

## Prerequisites

When making requests to Baseten, ensure you have the following:

* Your AI Gateway Account ID.
* Your AI Gateway gateway name.
* An active Baseten API token.
* The name of the Baseten model you want to use.

## OpenAI-compatible chat completions API

Baseten provides an OpenAI-compatible chat completions API for supported models.

### cURL

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/baseten/v1/chat/completions \
  --header 'Authorization: Bearer {baseten_api_token}' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "openai/gpt-oss-120b",
    "messages": [
      {
        "role": "user",
        "content": "What is Cloudflare?"
      }
    ]
  }'
```

### Use OpenAI SDK with JavaScript

```js
import OpenAI from "openai";

const apiKey = "{baseten_api_token}";
const accountId = "{account_id}";
const gatewayId = "{gateway_id}";
const baseURL = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/baseten`;

const openai = new OpenAI({
  apiKey,
  baseURL,
});

const model = "openai/gpt-oss-120b";
const messages = [{ role: "user", content: "What is Cloudflare?" }];

const chatCompletion = await openai.chat.completions.create({
  model,
  messages,
});

console.log(chatCompletion);
```

## OpenAI-Compatible Endpoint

You can also access Baseten models using the OpenAI API schema through the [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/). Send your requests to:

```txt
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

Specify:

```json

{
"model": "baseten/{model}"
}
```

## Model-specific endpoints

For models that don't use the OpenAI-compatible API, you can access them through their specific model endpoints.

### cURL

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/baseten/model/{model_id} \
  --header 'Authorization: Bearer {baseten_api_token}' \
  --header 'Content-Type: application/json' \
  --data '{
    "prompt": "What is Cloudflare?",
    "max_tokens": 100
  }'
```

### Use with JavaScript

```js
const accountId = "{account_id}";
const gatewayId = "{gateway_id}";
const basetenApiToken = "{baseten_api_token}";
const modelId = "{model_id}";
const baseURL = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/baseten`;

const response = await fetch(`${baseURL}/model/${modelId}`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${basetenApiToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "What is Cloudflare?",
    max_tokens: 100,
  }),
});

const result = await response.json();
console.log(result);
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/baseten/#page","headline":"Baseten · Cloudflare AI Gateway docs","description":"Route Baseten model inference requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/baseten/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
