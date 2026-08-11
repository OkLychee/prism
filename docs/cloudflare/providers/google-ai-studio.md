---
description: Route Google AI Studio and Gemini requests through AI Gateway for observability and control.
title: Google AI Studio
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Google AI Studio

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/google-ai-studio/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

[Google AI Studio ↗](https://ai.google.dev/aistudio) helps you build quickly with Google Gemini models.

## Endpoint

**Base URL:**

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/google-ai-studio
```

Then you can append the endpoint you want to hit, for example: `v1/models/{model}:{generative_ai_rest_resource}`

So your final URL will come together as: `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/google-ai-studio/v1/models/{model}:{generative_ai_rest_resource}`.

## Examples

### cURL

With API Key in Request

```bash
curl "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/google-ai-studio/v1/models/gemini-2.5-flash:generateContent" \
 --header 'content-type: application/json' \
 --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
 --header 'x-goog-api-key: {google_studio_api_key}' \
 --data '{
      "contents": [
          {
            "role":"user",
            "parts": [
              {"text":"What is Cloudflare?"}
            ]
          }
        ]
      }'
```

```bash
curl "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/google-ai-studio/v1/models/gemini-2.5-flash:generateContent" \
 --header 'content-type: application/json' \
 --header 'x-goog-api-key: {google_studio_api_key}' \
 --data '{
      "contents": [
          {
            "role":"user",
            "parts": [
              {"text":"What is Cloudflare?"}
            ]
          }
        ]
      }'
```

With Stored Keys (BYOK) / Unified Billing

```bash
curl "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/google-ai-studio/v1/models/gemini-2.5-flash:generateContent" \
 --header 'content-type: application/json' \
 --header 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
 --data '{
      "contents": [
          {
            "role":"user",
            "parts": [
              {"text":"What is Cloudflare?"}
            ]
          }
        ]
      }'
```

### `@google/genai`

If you are using the `@google/genai` package, you can set your endpoint like this:

With Key in Request

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "{google_studio_api_key}",
  httpOptions: {
	  baseUrl: `https://gateway.ai.cloudflare.com/v1/${account_id}/${gateway_name}/google-ai-studio`,
	  headers: {
		  'cf-aig-authorization': 'Bearer {cf_aig_token}',
	  }	
  }
});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "What is Cloudflare?",
});

console.log(response.text);
```

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "{google_studio_api_key}",
  httpOptions: {
	  baseUrl: `https://gateway.ai.cloudflare.com/v1/${account_id}/${gateway_name}/google-ai-studio`,
  }
});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "What is Cloudflare?",
});

console.log(response.text);
```

With Stored Keys (BYOK) / Unified Billing

```js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "{cf_aig_token}",
  httpOptions: {
	  baseUrl: `https://gateway.ai.cloudflare.com/v1/${account_id}/${gateway_name}/google-ai-studio`,
  }
});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "What is Cloudflare?",
});

console.log(response.text);
```

## OpenAI-Compatible Endpoint

You can also access Google AI Studio models using the OpenAI API schema through the [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/). Send your requests to:

```txt
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

Specify:

```json

{
"model": "google-ai-studio/{model}"
}
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/google-ai-studio/#page","headline":"Google AI Studio · Cloudflare AI Gateway docs","description":"Route Google AI Studio and Gemini requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/google-ai-studio/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
