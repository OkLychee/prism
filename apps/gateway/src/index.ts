import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GatewayContext } from './types';
import apiRouter from './routes/api';
import { createProtocolRouter } from './routes/protocol';
import mcpRouter from './routes/mcp';

const app = new Hono<GatewayContext>();

// Middleware: Global CORS
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Mcp-Session-Id', 'Mcp-Protocol-Version'],
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'prism-gateway' });
});

// Register Dashboard REST API Router
app.route('/api', apiRouter);

// Register MCP Server (interview records & trajectories, Bearer key from global settings)
app.route('/mcp', mcpRouter);

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
