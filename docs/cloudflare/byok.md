---
description: Securely store AI provider API keys in AI Gateway and reference them in your gateway configuration.
title: BYOK (Store Keys)
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# BYOK (Store Keys)

Last updated Jul 31, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

## Introduction

Bring your own keys (BYOK) is a feature in Cloudflare AI Gateway that allows you to securely store your AI provider API keys directly in the Cloudflare dashboard. Instead of including API keys in every request to your AI models, you can configure them once in the dashboard, and reference them in your gateway configuration.

The keys are stored securely with [Secrets Store](https://developers.cloudflare.com/secrets-store/) and allows for:

* Secure storage and limit exposure
* Easier key rotation
* Rate limit, budget limit and other restrictions with [Dynamic Routes](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/)

## Setting up BYOK

### Prerequisites

* Ensure your gateway is [authenticated](https://developers.cloudflare.com/ai-gateway/configuration/authentication/).
* Ensure you have appropriate [permissions](https://developers.cloudflare.com/secrets-store/access-control/) to create and deploy secrets on Secrets Store.

### Configure API keys

You can configure BYOK from the dashboard or by using the API.

#### Dashboard

When you add a provider key from the dashboard, AI Gateway creates and names the Secrets Store secret automatically.

1. Log into the [Cloudflare dashboard ↗](https://dash.cloudflare.com/) and select your account.
2. Go to **AI** \> **AI Gateway**.
3. Select your gateway or create a new one.
4. Go to the **Provider Keys** section.
5. Click **Add API Key**.
6. Select your AI provider from the dropdown.
7. Enter your API key and optionally provide a description.
8. Click **Save**.

#### API

If you use the API to configure BYOK, create the Secrets Store secret before you create the provider configuration. Name the secret with this format:

```txt
{gateway_id}_{provider_slug}_{alias}
```

For example, for gateway `my-gateway`, provider `anthropic`, and alias `default`, create the Secrets Store secret as:

```txt
my-gateway_anthropic_default
```

Then create the provider configuration with the same `provider_slug` and `alias` values.

The `secret_id` returned by Secrets Store is not used by AI Gateway for runtime lookup, so API-created secrets must follow the naming convention.

### Update your applications

Once you've configured your API keys in the dashboard:

1. **Remove API keys from your code**: Delete any hardcoded API keys or environment variables.
2. **Update request headers**: Remove provider authorization headers from your requests. Note that you still need to pass `cf-aig-authorization`.
3. **Test your integration**: Verify that requests work without including API keys.

## Example

With BYOK enabled, your workflow changes from:

1. **Traditional approach**: Include API key in every request header  
```bash  
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  -H 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [...]}'  
```
2. **BYOK approach**: Configure key once in dashboard, make requests without exposing keys  
```bash  
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  -H 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [...]}'  
```

## Managing API keys

### Viewing configured keys

In the AI Gateway dashboard, you can:

* View all configured API keys by provider
* See when each key was last used
* Check the status of each key (active, expired, invalid)

### Rotating keys

To rotate an API key:

1. Generate a new API key from your AI provider
2. In the Cloudflare dashboard, edit the existing key entry
3. Replace the old key with the new one
4. Save the changes

Your applications will immediately start using the new key without any code changes or downtime.

### Revoking access

To remove an API key:

1. In the AI Gateway dashboard, find the key you want to remove
2. Click the **Delete** button
3. Confirm the deletion

Impact of key deletion

Deleting an API key will immediately stop all requests that depend on it. Make sure to update your applications or configure alternative keys before deletion.

## Multiple keys per provider

AI Gateway supports storing multiple API keys for the same provider. This allows you to:

* Use different keys for different use cases (for example, development vs production)
* Gradually migrate between keys during rotation

### Key aliases

Each API key can be assigned an alias to identify it. When you add a key, you can specify a custom alias, or the system will use `default` as the alias.

When making requests, AI Gateway uses the key with the `default` alias by default. To use a different key, include the `cf-aig-byok-alias` header with the alias of the key you want to use.

Note

The `cf-aig-byok-alias` header applies to [direct provider-passthrough](https://developers.cloudflare.com/ai-gateway/usage/providers/) requests. On requests routed through [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) endpoints (for example, `env.AI.run()` or `/ai/v1/chat/completions`), only the `default` alias is consulted — if the `default` key is missing, the request falls through to Unified Billing. See [Credential precedence](https://developers.cloudflare.com/ai-gateway/features/unified-billing/#credential-precedence) for the full order.

### Example: Using a specific key alias

If you have multiple OpenAI keys configured with different aliases (for example, `default`, `production`, and `testing`), you can specify which one to use:

```bash
# Uses the key with alias "default" (no header needed)
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  -H 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

```bash
# Uses the key with alias "production"
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  -H 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  -H 'cf-aig-byok-alias: production' \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

```bash
# Uses the key with alias "testing"
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai/chat/completions \
  -H 'cf-aig-authorization: Bearer {CF_AIG_TOKEN}' \
  -H 'cf-aig-byok-alias: testing' \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [...]}'
```

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"WebPage","@id":"https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/#page","headline":"BYOK (Store Keys) · Cloudflare AI Gateway docs","description":"Securely store AI provider API keys in AI Gateway and reference them in your gateway configuration.","url":"https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-07-31","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
