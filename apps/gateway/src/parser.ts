export interface ParsedPromptResult {
  systemPrompt: string;
  userPrompt: string;
  userPromptCount: number;
}

export function parsePromptPayload(protocol: 'openai' | 'anthropic', payload: any): ParsedPromptResult {
  let systemPrompt = '';
  let userPrompt = '';
  let userPromptCount = 0;

  if (!payload || typeof payload !== 'object') {
    return { systemPrompt, userPrompt, userPromptCount };
  }

  if (protocol === 'openai') {
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += (systemPrompt ? '\n---\n' : '') + stringifyContent(msg.content);
      } else if (msg.role === 'user') {
        userPromptCount++;
        userPrompt = stringifyContent(msg.content); // Store latest user prompt for quick access
      }
    }
  } else if (protocol === 'anthropic') {
    // Anthropic passes system prompt as top-level string or array
    if (payload.system) {
      systemPrompt = typeof payload.system === 'string' ? payload.system : JSON.stringify(payload.system);
    }

    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    for (const msg of messages) {
      if (msg.role === 'user') {
        userPromptCount++;
        userPrompt = stringifyContent(msg.content);
      }
    }
  }

  return {
    systemPrompt,
    userPrompt,
    userPromptCount,
  };
}

function stringifyContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && item.type === 'text') return item.text || '';
        return JSON.stringify(item);
      })
      .join('\n');
  }
  return content ? JSON.stringify(content) : '';
}
