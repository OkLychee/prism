export interface ParsedPromptResult {
  systemPrompt: string;
  userPrompt: string;
  userPromptHash: string;
  userPromptCount: number;
}

export function computePromptHash(prompt: string): string {
  if (!prompt) return '';
  // Simple, fast FNV-1a 32-bit Hash converted to hex for zero-dependency CPU efficiency
  let hash = 0x811c9dc5;
  for (let i = 0; i < prompt.length; i++) {
    hash ^= prompt.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export function parsePromptPayload(protocol: 'openai' | 'anthropic', payload: any): ParsedPromptResult {
  let systemPrompt = '';
  let userPrompt = '';
  let userPromptCount = 0;

  if (!payload || typeof payload !== 'object') {
    return { systemPrompt, userPrompt, userPromptHash: '', userPromptCount };
  }

  if (protocol === 'openai') {
    // 1. OpenAI Responses API schema (payload.input & payload.instructions)
    if (payload.instructions && typeof payload.instructions === 'string') {
      systemPrompt = payload.instructions;
    }

    if (payload.input) {
      if (typeof payload.input === 'string') {
        userPromptCount++;
        userPrompt = payload.input;
      } else if (Array.isArray(payload.input)) {
        for (const item of payload.input) {
          if (typeof item === 'string') {
            userPromptCount++;
            userPrompt = item;
          } else if (item && typeof item === 'object') {
            if (item.role === 'system' || item.role === 'developer') {
              systemPrompt += (systemPrompt ? '\n---\n' : '') + stringifyContent(item.content);
            } else if (item.role === 'user') {
              userPromptCount++;
              userPrompt = stringifyContent(item.content);
            }
          }
        }
      }
    }

    // 2. OpenAI Chat Completions API schema (payload.messages)
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    for (const msg of messages) {
      if (msg.role === 'system' || msg.role === 'developer') {
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
    userPromptHash: computePromptHash(userPrompt),
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
