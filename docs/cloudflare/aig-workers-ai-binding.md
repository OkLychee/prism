---
description: This guide will walk you through setting up and deploying a Workers AI project. You will use Workers, an AI Gateway binding, and a large language model (LLM) to deploy your first AI-powered application on the Cloudflare global network.
title: Set up Workers AI with AI Gateway
image: https://developers.cloudflare.com/og-docs.png
---

[Skip to content](#main-content)

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/ai-gateway/llms.txt  
> Use this file to discover all available pages before exploring further.

# Set up Workers AI with AI Gateway

Last updated Jun 12, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)

This guide will walk you through setting up and deploying a Workers AI project. You will use [Workers](https://developers.cloudflare.com/workers/), an AI Gateway binding, and a large language model (LLM), to deploy your first AI-powered application on the Cloudflare global network.

## Prerequisites

1. Sign up for a [Cloudflare account ↗](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Install [Node.js ↗](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Node.js version manager

Use a Node version manager like [Volta ↗](https://volta.sh/) or [nvm ↗](https://github.com/nvm-sh/nvm) to avoid permission issues and change Node.js versions. [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), discussed later in this guide, requires a Node version of `16.17.0` or later.

## 1\. Create a Worker Project

You will create a new Worker project using the create-Cloudflare CLI (C3). C3 is a command-line tool designed to help you set up and deploy new applications to Cloudflare.

Create a new project named `hello-ai` by running:

npmyarnpnpm

```
npm create cloudflare@latest -- hello-ai
```

```
yarn create cloudflare hello-ai
```

```
pnpm create cloudflare@latest hello-ai
```

Running `npm create cloudflare@latest` will prompt you to install the create-cloudflare package and lead you through setup. C3 will also install [Wrangler](https://developers.cloudflare.com/workers/wrangler/), the Cloudflare Developer Platform CLI.

For setup, select the following options:

* For _What would you like to start with?_, choose `Hello World example`.
* For _Which template would you like to use?_, choose `Worker only`.
* For _Which language do you want to use?_, choose `TypeScript`.
* For _Do you want to use git for version control?_, choose `Yes`.
* For _Do you want to deploy your application?_, choose `No` (we will be making some changes before deploying).

This will create a new `hello-ai` directory. Your new `hello-ai` directory will include:

* A "Hello World" Worker at `src/index.ts`.
* A [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/)

Go to your application directory:

```bash
cd hello-ai
```

## 2\. Connect your Worker to Workers AI

You must create an AI binding for your Worker to connect to Workers AI. Bindings allow your Workers to interact with resources, like Workers AI, on the Cloudflare Developer Platform.

To bind Workers AI to your Worker, add the following to the end of your [Wrangler configuration file](https://developers.cloudflare.com/workers/wrangler/configuration/):

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

Your binding is [available in your Worker code](https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/#bindings-in-es-modules-format) on [env.AI](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/).

You can use `"default"` as the gateway ID in the next step. AI Gateway automatically creates a default gateway on the first authenticated request. Alternatively, you can [create a gateway manually](https://developers.cloudflare.com/ai-gateway/get-started/) and use its ID.

## 3\. Run an inference task containing AI Gateway in your Worker

You are now ready to run an inference task in your Worker. In this case, you will use an LLM, [llama-3.1-8b-instruct-fast](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fast/), to answer a question.

Update the `index.ts` file in your `hello-ai` application directory with the following code:

```typescript
export interface Env {
	// If you set another name in the [Wrangler configuration file](/workers/wrangler/configuration/) as the value for 'binding',
	// replace "AI" with the variable name you defined.
	AI: Ai;
}

export default {
	async fetch(request, env): Promise<Response> {
		// Specify the gateway label and other options here
		const response = await env.AI.run(
			"@cf/meta/llama-3.1-8b-instruct-fast",
			{
				prompt: "What is the origin of the phrase Hello, World",
			},
			{
				gateway: {
					id: "default", // Uses the default gateway, or replace with your gateway ID
					skipCache: true, // Optional: Skip cache if needed
				},
			},
		);

		// Return the AI response as a JSON object
		return new Response(JSON.stringify(response), {
			headers: { "Content-Type": "application/json" },
		});
	},
} satisfies ExportedHandler<Env>;
```

Up to this point, you have created an AI binding for your Worker and configured your Worker to be able to execute the Llama 3.1 model. You can now test your project locally before you deploy globally.

## 4\. Develop locally with Wrangler

While in your project directory, test Workers AI locally by running [wrangler dev](https://developers.cloudflare.com/workers/wrangler/commands/general/#dev):

```bash
npx wrangler dev
```

Workers AI local development usage charges

Using Workers AI always accesses your Cloudflare account in order to run AI models and will incur usage charges even in local development.

You will be prompted to log in after you run `wrangler dev`. When you run `npx wrangler dev`, Wrangler will give you a URL (most likely `localhost:8787`) to review your Worker. After you go to the URL Wrangler provides, you will see a message that resembles the following example:

```json
{
  "response": "A fascinating question!\n\nThe phrase \"Hello, World!\" originates from a simple computer program written in the early days of programming. It is often attributed to Brian Kernighan, a Canadian computer scientist and a pioneer in the field of computer programming.\n\nIn the early 1970s, Kernighan, along with his colleague Dennis Ritchie, were working on the C programming language. They wanted to create a simple program that would output a message to the screen to demonstrate the basic structure of a program. They chose the phrase \"Hello, World!\" because it was a simple and recognizable message that would illustrate how a program could print text to the screen.\n\nThe exact code was written in the 5th edition of Kernighan and Ritchie's book \"The C Programming Language,\" published in 1988. The code, literally known as \"Hello, World!\" is as follows:\n\n    main()\n    {\n      printf(\"Hello, World!\");\n    }\n\nThis code is still often used as a starting point for learning programming languages, as it demonstrates how to output a simple message to the console.\n\nThe phrase \"Hello, World!\" has since become a catch-all phrase to indicate the start of a new program or a small test program, and is widely used in computer science and programming education.\n\nSincerely, I'm glad I could help clarify the origin of this iconic phrase for you!"
}
```

## 5\. Deploy your AI Worker

Before deploying your AI Worker globally, log in with your Cloudflare account by running:

```bash
npx wrangler login
```

You will be directed to a web page asking you to log in to the Cloudflare dashboard. After you have logged in, you will be asked if Wrangler can make changes to your Cloudflare account. Scroll down and select **Allow** to continue.

Finally, deploy your Worker to make your project accessible on the Internet. To deploy your Worker, run:

```bash
npx wrangler deploy
```

Once deployed, your Worker will be available at a URL like:

```bash
https://hello-ai.<YOUR_SUBDOMAIN>.workers.dev
```

Your Worker will be deployed to your custom [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) subdomain. You can now visit the URL to run your AI Worker.

By completing this tutorial, you have created a Worker, connected it to Workers AI through an AI Gateway binding, and successfully ran an inference task using the Llama 3.1 model.

## Next steps

* [Workers bindings](https://developers.cloudflare.com/ai-gateway/usage/worker-binding-methods/) — Call third-party models, access gateway methods, and integrate with AI SDKs.

Was this helpful?

YesNo

## On this page

[![](https://developers.cloudflare.com/_astro/logo.DMYpXs3t.svg)Docs](https://developers.cloudflare.com/)

```json
{"@context":"https://schema.org","@type":"TechArticle","@id":"https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/#page","headline":"Set up Workers AI with AI Gateway · Cloudflare AI Gateway docs","description":"This guide will walk you through setting up and deploying a Workers AI project. You will use Workers, an AI Gateway binding, and a large language model (LLM) to deploy your first AI-powered application on the Cloudflare global network.","url":"https://developers.cloudflare.com/ai-gateway/integrations/aig-workers-ai-binding/","inLanguage":"en","image":"https://developers.cloudflare.com/og-docs.png","dateModified":"2026-06-12","publisher":{"@type":"Organization","name":"Cloudflare","url":"https://www.cloudflare.com/"},"isPartOf":{"@type":"WebSite","@id":"https://developers.cloudflare.com/#website","name":"Cloudflare Docs","url":"https://developers.cloudflare.com/"}}
```
