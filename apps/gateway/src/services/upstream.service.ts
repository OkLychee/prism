import { eq, like, desc, sql } from 'drizzle-orm';
import type { UpstreamConfig } from '@oklychee/prism-shared';
import { Database } from '../db';
import { upstreamConfigs } from '../db/schema';

export class UpstreamService {
  constructor(private db: Database) {}

  async listUpstreams(): Promise<UpstreamConfig[]> {
    const results = await this.db
      .select({
        id: upstreamConfigs.id,
        name: upstreamConfigs.name,
        provider_type: upstreamConfigs.provider_type,
        cf_aig_provider: upstreamConfigs.cf_aig_provider,
        api_protocol: upstreamConfigs.api_protocol,
        base_url: upstreamConfigs.base_url,
        api_key: upstreamConfigs.api_key,
        available_models: upstreamConfigs.available_models,
        created_at: upstreamConfigs.created_at,
      })
      .from(upstreamConfigs)
      .orderBy(desc(upstreamConfigs.created_at));

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      provider_type: r.provider_type as UpstreamConfig['provider_type'],
      cf_aig_provider: r.cf_aig_provider || undefined,
      api_protocol: (r.api_protocol || 'openai') as UpstreamConfig['api_protocol'],
      base_url: r.base_url,
      api_key: '', // Never leak raw API key
      api_key_configured: Boolean(r.api_key && r.api_key.trim().length > 0),
      available_models: JSON.parse(r.available_models || '[]'),
      created_at: r.created_at,
    }));
  }

  async createUpstream(data: {
    name?: string;
    provider_type?: string;
    cf_aig_provider?: string;
    api_protocol?: string;
    base_url?: string;
    api_key?: string;
    available_models?: string[];
  }) {
    const id = `upstream_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const name = data.name || 'Custom Provider';
    const providerType = data.provider_type || 'cf_ai_gateway';
    const cfAigProvider = data.cf_aig_provider || 'openai';

    let apiProtocol = data.api_protocol || 'openai';
    if (providerType === 'cf_ai_gateway' || providerType === 'cf_workers_ai') {
      apiProtocol = 'openai';
    }

    let baseUrl = data.base_url || '';
    if (providerType === 'cf_ai_gateway') {
      baseUrl = `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/${cfAigProvider}`;
    } else if (providerType === 'cf_workers_ai') {
      baseUrl = '';
    }

    let apiKey = data.api_key || '';
    if (providerType === 'cf_workers_ai') {
      apiKey = '';
    }

    const availableModels = JSON.stringify(data.available_models || []);
    const createdAt = Date.now();

    await this.db.insert(upstreamConfigs).values({
      id,
      name,
      provider_type: providerType,
      cf_aig_provider: cfAigProvider,
      api_protocol: apiProtocol,
      base_url: baseUrl,
      api_key: apiKey,
      available_models: availableModels,
      created_at: createdAt,
    });

    return {
      id,
      name,
      provider_type: providerType,
      cf_aig_provider: cfAigProvider,
      api_protocol: apiProtocol,
      base_url: baseUrl,
      api_key: apiKey ? '******' : '',
      available_models: data.available_models || [],
      created_at: createdAt,
    };
  }

  async updateUpstream(
    id: string,
    data: {
      name?: string;
      provider_type?: string;
      cf_aig_provider?: string;
      api_protocol?: string;
      base_url?: string;
      api_key?: string;
      available_models?: string[];
    }
  ) {
    const providerType = data.provider_type || 'cf_ai_gateway';
    const cfAigProvider = data.cf_aig_provider || 'openai';

    let apiProtocol = data.api_protocol || 'openai';
    if (providerType === 'cf_ai_gateway' || providerType === 'cf_workers_ai') {
      apiProtocol = 'openai';
    }

    let baseUrl = data.base_url || '';
    if (providerType === 'cf_ai_gateway') {
      baseUrl = `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/${cfAigProvider}`;
    } else if (providerType === 'cf_workers_ai') {
      baseUrl = '';
    }

    let apiKey = data.api_key || '';
    if (providerType === 'cf_workers_ai') {
      apiKey = '';
    }

    const availableModels = JSON.stringify(data.available_models || []);

    if (providerType === 'cf_workers_ai') {
      await this.db
        .update(upstreamConfigs)
        .set({
          name: data.name,
          provider_type: providerType,
          cf_aig_provider: cfAigProvider,
          api_protocol: apiProtocol,
          base_url: baseUrl,
          api_key: '',
          available_models: availableModels,
        })
        .where(eq(upstreamConfigs.id, id));
    } else if (data.api_key !== undefined) {
      await this.db
        .update(upstreamConfigs)
        .set({
          name: data.name,
          provider_type: providerType,
          cf_aig_provider: cfAigProvider,
          api_protocol: apiProtocol,
          base_url: baseUrl,
          api_key: data.api_key.trim(),
          available_models: availableModels,
        })
        .where(eq(upstreamConfigs.id, id));
    } else {
      await this.db
        .update(upstreamConfigs)
        .set({
          name: data.name,
          provider_type: providerType,
          cf_aig_provider: cfAigProvider,
          api_protocol: apiProtocol,
          base_url: baseUrl,
          available_models: availableModels,
        })
        .where(eq(upstreamConfigs.id, id));
    }
  }

  async deleteUpstream(id: string) {
    await this.db
      .delete(upstreamConfigs)
      .where(eq(upstreamConfigs.id, id));
  }

  async findById(id: string) {
    const [config] = await this.db
      .select()
      .from(upstreamConfigs)
      .where(eq(upstreamConfigs.id, id))
      .limit(1);

    if (!config) return null;
    return {
      ...config,
      api_protocol: config.api_protocol || 'openai',
      available_models: JSON.parse(config.available_models || '[]'),
    };
  }

  async findConfigForModel(modelName: string, preferredUpstreamId?: string) {
    if (preferredUpstreamId) {
      const config = await this.findById(preferredUpstreamId);
      if (config) return config;
    }

    const [config] = await this.db
      .select()
      .from(upstreamConfigs)
      .where(like(upstreamConfigs.available_models, `%"${modelName}"%`))
      .limit(1);

    if (!config) return null;

    return {
      ...config,
      api_protocol: config.api_protocol || 'openai',
      available_models: JSON.parse(config.available_models || '[]'),
    };
  }
}
