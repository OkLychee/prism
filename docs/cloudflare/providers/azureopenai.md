---
description: Route Azure OpenAI requests through AI Gateway for observability and control.
title: Azure OpenAI
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Azure OpenAI

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/azureopenai/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[Azure OpenAI ↗](https://azure.microsoft.com/en-gb/products/ai-services/openai-service/) allows you apply natural language algorithms on your data.

## Endpoint

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/azure-openai/{resource_name}/{deployment_name}
```

## Prerequisites

When making requests to Azure OpenAI, you will need:

* AI Gateway account ID
* AI Gateway gateway name
* Azure OpenAI API key
* Azure OpenAI resource name
* Azure OpenAI deployment name (aka model name)

## URL structure

Your new base URL will use the data above in this structure: `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/azure-openai/{resource_name}/{deployment_name}`. Then, you can append your endpoint and api-version at the end of the base URL, like `.../chat/completions?api-version=2023-05-15`.

## Examples

### cURL

```bash
curl 'https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/azure-openai/{resource_name}/{deployment_name}/chat/completions?api-version=2023-05-15' \
  --header 'Content-Type: application/json' \
  --header 'api-key: {azure_api_key}' \
  --data '{
  "messages": [
    {
      "role": "user",
      "content": "What is Cloudflare?"
    }
  ]
}'
```

### Use `openai` JavaScript SDK

```js
import { AzureOpenAI } from "openai";

const azure_openai = new AzureOpenAI({
  apiKey: "{azure_api_key}",
  baseURL: `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/azure-openai/{resource_name}/`,
  apiVersion: "2023-05-15",
  defaultHeaders: { "cf-aig-authorization": "{cf-api-token}" }, // if authenticated
});

const result = await azure_openai.chat.completions.create({
  model: '{deployment_name}',
  messages: [{ role: "user", content: "Hello" }],
});
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/azureopenai/#page","headline":"Azure OpenAI · Cloudflare AI Gateway docs","description":"Route Azure OpenAI requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/azureopenai/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
