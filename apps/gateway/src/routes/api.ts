import { Hono } from 'hono';
import { DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from '@oklychee/prism-shared';
import { GatewayContext } from '../types';
import { KeyService } from '../services/key.service';
import { UpstreamService } from '../services/upstream.service';
import { AuditLogService } from '../services/audit.service';
import { SettingsService } from '../services/settings.service';
import { AuthService, hashPassword, comparePassword } from '../services/auth.service';
import { getDb } from '../db';

const api = new Hono<GatewayContext>();

// 0. Public Auth Endpoints
// Helper to verify Cloudflare Turnstile Token
async function verifyTurnstileToken(secretKey: string, token: string, remoteIp?: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome: any = await res.json();
    return outcome.success === true;
  } catch (err) {
    console.error('Turnstile verification request failed:', err);
    return false;
  }
}

// POST /api/auth/login - Admin Login
api.post('/auth/login', async (c) => {
  try {
    const { username, password, turnstile_token } = await c.req.json();
    if (!username || typeof username !== 'string') {
      return c.json({ error: 'Username is required' }, 400);
    }

    // Optional Cloudflare Turnstile Security Guard
    if (c.env.TURNSTILE_SECRET_KEY && c.env.TURNSTILE_SECRET_KEY.trim() !== '') {
      if (!turnstile_token) {
        return c.json({ error: 'Security verification required (Turnstile token missing)' }, 400);
      }
      const clientIp = c.req.header('cf-connecting-ip');
      const isValidTurnstile = await verifyTurnstileToken(c.env.TURNSTILE_SECRET_KEY, turnstile_token, clientIp);
      if (!isValidTurnstile) {
        return c.json({ error: 'Turnstile verification failed. Please try again.' }, 403);
      }
    }

    const db = getDb(c.env.DB);
    const settingsService = new SettingsService(db);
    const settings = await settingsService.getAllSettings();

    const expectedUsername = settings.admin_username || DEFAULT_ADMIN_USERNAME;
    const hasConfiguredPasswordHash = Boolean(settings.admin_password_hash);
    const defaultPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    const expectedPasswordHash = settings.admin_password_hash || defaultPasswordHash;

    const isMatch = await comparePassword(password || '', expectedPasswordHash);

    if (username.trim() !== expectedUsername || !isMatch) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    const authService = new AuthService(db);
    const { rawToken, expiresAt } = await authService.generateToken();

    return c.json({
      token: rawToken,
      expires_at: expiresAt,
      must_change_password: !hasConfiguredPasswordHash,
    });
  } catch (err: any) {
      return c.json({ error: err.message || 'Login failed' }, 500);
  }
});

// GET /api/auth/check - Check token status
api.get('/auth/check', async (c) => {
  const authHeader = c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return c.json({ authenticated: false }, 401);
  }

  const db = getDb(c.env.DB);
  const authService = new AuthService(db);
  const isValid = await authService.verifyToken(token);
  if (!isValid) {
    return c.json({ authenticated: false }, 401);
  }

  const settingsService = new SettingsService(db);
  const settings = await settingsService.getAllSettings();
  const mustChangePassword = !settings.admin_password_hash;

  return c.json({ authenticated: true, must_change_password: mustChangePassword });
});

// POST /api/auth/logout - Admin Logout
api.post('/auth/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (token) {
    const authService = new AuthService(getDb(c.env.DB));
    await authService.revokeToken(token);
  }

  return c.json({ success: true });
});

// Middleware: Protect all /api/* routes except /api/auth/*
api.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth/')) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const db = getDb(c.env.DB);
  const authService = new AuthService(db);
  const isValid = await authService.verifyToken(token);
  if (!isValid) {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  // Security Policy Check: If admin_password_hash is NOT set (using default password),
  // block ALL API actions except updating settings (setting password)
  const settingsService = new SettingsService(db);
  const settings = await settingsService.getAllSettings();

  if (!settings.admin_password_hash) {
    // Only POST /api/settings is allowed so user can modify initial password
    if (c.req.path !== '/api/settings' || c.req.method !== 'POST') {
      return c.json(
        { error: 'Forbidden: Initial password must be changed before accessing other features' },
        403
      );
    }
  }

  await next();
});

// 1. GET /api/keys - List all interview keys
api.get('/keys', async (c) => {
  const keyService = new KeyService(getDb(c.env.DB));
  const data = await keyService.listKeys();
  return c.json({ data });
});

// 2. POST /api/keys - Create a new candidate interview key
api.post('/keys', async (c) => {
  try {
    const body = await c.req.json();
    const keyService = new KeyService(getDb(c.env.DB));
    const data = await keyService.createKey(body);
    return c.json({ data }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 2.1 PUT /api/keys/:id - Update candidate interview key details
api.put('/keys/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const keyService = new KeyService(getDb(c.env.DB));
    const data = await keyService.updateKey(id, body);
    return c.json({ data });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 2.2 PUT /api/keys/:id/status - Update candidate key status (e.g. disable/enable)
api.put('/keys/:id/status', async (c) => {
  const id = c.req.param('id');
  try {
    const { status } = await c.req.json();
    const keyService = new KeyService(getDb(c.env.DB));
    await keyService.updateKeyStatus(id, status);
    return c.json({ success: true, id, status });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 2.2 DELETE /api/keys/:id - Delete candidate key
api.delete('/keys/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const keyService = new KeyService(getDb(c.env.DB));
    await keyService.deleteKey(id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 3. GET /api/logs - Fetch interaction timeline logs with limit and offset pagination
api.get('/logs', async (c) => {
  const keyId = c.req.query('key_id');
  const limitStr = c.req.query('limit');
  const offsetStr = c.req.query('offset');
  const orderParam = c.req.query('order');

  const limit = limitStr ? parseInt(limitStr, 10) : 50;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  const order = orderParam === 'asc' ? 'asc' : 'desc';

  const auditService = new AuditLogService(getDb(c.env.DB));
  const data = await auditService.listLogs(keyId, limit, offset, order);
  const hasMore = data.length >= limit;

  return c.json({ data, hasMore });
});

// 3.1 GET /api/logs/:id/detail - Fetch single log full detail (Reading from D1 or R2 Bucket)
api.get('/logs/:id/detail', async (c) => {
  const id = c.req.param('id');
  const auditService = new AuditLogService(getDb(c.env.DB));
  const logRecord = await auditService.getLogById(id);

  if (!logRecord) {
    return c.json({ error: 'Log record not found' }, 404);
  }

  let fullPayload = logRecord.full_payload;
  let responseContent = logRecord.response_content;

  // If stored in R2, fetch the full content JSON from LOG_BUCKET
  if (logRecord.r2_log_key && c.env.LOG_BUCKET) {
    try {
      const r2Object = await c.env.LOG_BUCKET.get(logRecord.r2_log_key);
      if (r2Object) {
        const jsonText = await r2Object.text();
        const parsed = JSON.parse(jsonText);
        fullPayload = JSON.stringify(parsed.full_payload || {});
        responseContent = parsed.response_content || '';
      }
    } catch (err) {
      console.error('Failed to read log from R2 bucket:', err);
    }
  }

  return c.json({
    data: {
      ...logRecord,
      full_payload: fullPayload,
      response_content: responseContent,
    },
  });
});

// 4. GET /api/upstreams - List upstream provider configs
api.get('/upstreams', async (c) => {
  const upstreamService = new UpstreamService(getDb(c.env.DB));
  const data = await upstreamService.listUpstreams();
  return c.json({ data });
});

// 5. POST /api/upstreams - Create upstream provider config
api.post('/upstreams', async (c) => {
  try {
    const body = await c.req.json();
    const upstreamService = new UpstreamService(getDb(c.env.DB));
    const data = await upstreamService.createUpstream(body);
    return c.json({ data }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 6. PUT /api/upstreams/:id - Update upstream provider config
api.put('/upstreams/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const upstreamService = new UpstreamService(getDb(c.env.DB));
    await upstreamService.updateUpstream(id, body);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 7. DELETE /api/upstreams/:id - Delete upstream provider config
api.delete('/upstreams/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const upstreamService = new UpstreamService(getDb(c.env.DB));
    await upstreamService.deleteUpstream(id);
    return c.json({ success: true, id });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

// 8. GET /api/settings - Fetch global system settings (Sanitizing sensitive tokens)
api.get('/settings', async (c) => {
  const settingsService = new SettingsService(getDb(c.env.DB));
  const rawData = await settingsService.getAllSettings();

  const response = {
    cf_account_id: rawData.cf_account_id || '',
    cf_gateway_id: rawData.cf_gateway_id || 'default',
    cf_api_token_configured: Boolean(rawData.cf_api_token && rawData.cf_api_token.trim().length > 0),
    admin_username: rawData.admin_username || DEFAULT_ADMIN_USERNAME,
    timezone_mode: (rawData.timezone_mode as 'UTC' | 'system') || 'UTC',
    log_storage_engine: (rawData.log_storage_engine as 'd1' | 'r2') || 'd1',
  };

  return c.json({ data: response });
});

// 9. POST /api/settings - Update global system settings
api.post('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const settingsService = new SettingsService(getDb(c.env.DB));
    const currentSettings = await settingsService.getAllSettings();

    const updatePayload: Record<string, string> = {};
    if (typeof body.cf_account_id === 'string') {
      updatePayload.cf_account_id = body.cf_account_id.trim();
    }
    if (typeof body.cf_gateway_id === 'string') {
      updatePayload.cf_gateway_id = body.cf_gateway_id.trim() || 'default';
    }
    if (typeof body.timezone_mode === 'string') {
      updatePayload.timezone_mode = body.timezone_mode === 'system' ? 'system' : 'UTC';
    }
    if (typeof body.log_storage_engine === 'string') {
      updatePayload.log_storage_engine = body.log_storage_engine === 'r2' ? 'r2' : 'd1';
    }

    // Only update cf_api_token if user explicitly passed a non-undefined value
    // If cf_api_token is passed as empty string '', it clears the token.
    // If cf_api_token is omitted or null, it retains the existing token in DB.
    if (body.cf_api_token !== undefined && body.cf_api_token !== null) {
      updatePayload.cf_api_token = body.cf_api_token.trim();
    }

    if (typeof body.admin_username === 'string' && body.admin_username.trim()) {
      updatePayload.admin_username = body.admin_username.trim();
    }

    if (typeof body.admin_password === 'string' && body.admin_password) {
      // If admin_password_hash already exists in DB (not initial force change),
      // verify the provided old_admin_password first.
      if (currentSettings.admin_password_hash) {
        if (!body.old_admin_password) {
          return c.json({ error: 'Old password is required to change admin password' }, 400);
        }
        const isOldPasswordMatch = await comparePassword(body.old_admin_password, currentSettings.admin_password_hash);
        if (!isOldPasswordMatch) {
          return c.json({ error: 'Incorrect old password' }, 400);
        }
      }

      updatePayload.admin_password_hash = await hashPassword(body.admin_password);
    }

    await settingsService.saveSettings(updatePayload);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

export default api;

