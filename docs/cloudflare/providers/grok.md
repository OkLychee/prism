---
description: Route xAI (Grok) API requests through AI Gateway for observability and control.
title: xAI
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# xAI

Last updated Apr 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/usage/providers/grok/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

## Endpoint

```txt
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok
```

## URL structure

When making requests to [Grok ↗](https://docs.x.ai/docs#getting-started), replace `https://api.x.ai/v1` in the URL you are currently using with `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok`.

## Prerequisites

When making requests to Grok, ensure you have the following:

* Your AI Gateway Account ID.
* Your AI Gateway gateway name.
* An active xAI API token.
* The name of the xAI model you want to use.

## Examples

### cURL

```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok/v1/chat/completions \
  --header 'content-type: application/json' \
  --header 'Authorization: Bearer {xai_api_token}' \
  --data '{
    "model": "grok-4",
    "messages": [
        {
            "role": "user",
            "content": "What is Cloudflare?"
        }
    ]
}'
```

### Use OpenAI SDK with JavaScript

If you are using the OpenAI SDK with JavaScript, you can set your endpoint like this:

```js
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: "<api key>",
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok",
});

const completion = await openai.chat.completions.create({
	model: "grok-4",
	messages: [
		{
			role: "system",
			content:
				"You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
		},
		{
			role: "user",
			content: "What is the meaning of life, the universe, and everything?",
		},
	],
});

console.log(completion.choices[0].message);
```

### Use OpenAI SDK with Python

If you are using the OpenAI SDK with Python, you can set your endpoint like this:

```python
import os
from openai import OpenAI

XAI_API_KEY = os.getenv("XAI_API_KEY")
client = OpenAI(
    api_key=XAI_API_KEY,
    base_url="https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok",
)

completion = client.chat.completions.create(
    model="grok-4",
    messages=[
        {"role": "system", "content": "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy."},
        {"role": "user", "content": "What is the meaning of life, the universe, and everything?"},
    ],
)

print(completion.choices[0].message)
```

### Use Anthropic SDK with JavaScript

If you are using the Anthropic SDK with JavaScript, you can set your endpoint like this:

```js
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
	apiKey: "<api key>",
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok",
});

const msg = await anthropic.messages.create({
	model: "grok-beta",
	max_tokens: 128,
	system:
		"You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
	messages: [
		{
			role: "user",
			content: "What is the meaning of life, the universe, and everything?",
		},
	],
});

console.log(msg);
```

### Use Anthropic SDK with Python

If you are using the Anthropic SDK with Python, you can set your endpoint like this:

```python
import os
from anthropic import Anthropic

XAI_API_KEY = os.getenv("XAI_API_KEY")
client = Anthropic(
    api_key=XAI_API_KEY,
    base_url="https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/grok",
)

message = client.messages.create(
    model="grok-beta",
    max_tokens=128,
    system="You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
    messages=[
        {
            "role": "user",
            "content": "What is the meaning of life, the universe, and everything?",
        },
    ],
)

print(message.content)
```

## OpenAI-Compatible Endpoint

You can also access Grok models using the OpenAI API schema through the [REST API](https://developers.cloudflare.com/ai-gateway/usage/rest-api/). Send your requests to:

```txt
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions
```

Specify:

```json

{
"model": "grok/{model}"
}
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/usage/providers/grok/#page","headline":"xAI · Cloudflare AI Gateway docs","description":"Route xAI (Grok) API requests through AI Gateway for observability and control.","url":"https://developers.cloudflare.com/ai-gateway/usage/providers/grok/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-04-20","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
