import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GatewayContext } from './types';
import apiRouter from './routes/api';
import { createProtocolRouter } from './routes/protocol';

const app = new Hono<GatewayContext>();

// Middleware: Global CORS
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'prism-gateway' });
});

// Register Dashboard REST API Router
app.route('/api', apiRouter);

// Register LLM Gateway Protocol Routers
app.route('/openai', createProtocolRouter('openai'));
app.route('/anthropic', createProtocolRouter('anthropic'));

// SPA HTML Fallback & Static Assets Handler for Cloudflare Workers Assets
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.notFound();
});

export default app;
