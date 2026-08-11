/**
 * Adapts incoming Anthropic messages payload to OpenAI chat completions payload.
 */
export function anthropicToOpenAiPayload(anthropicPayload: any): any {
  if (!anthropicPayload || typeof anthropicPayload !== 'object') {
    return anthropicPayload;
  }

  const messages: any[] = [];

  // 1. Convert top-level system prompt if present
  if (anthropicPayload.system) {
    const systemContent = typeof anthropicPayload.system === 'string'
      ? anthropicPayload.system
      : JSON.stringify(anthropicPayload.system);
    messages.push({ role: 'system', content: systemContent });
  }

  // 2. Convert messages array
  const rawMessages = Array.isArray(anthropicPayload.messages) ? anthropicPayload.messages : [];
  for (const msg of rawMessages) {
    let content = msg.content;
    if (Array.isArray(msg.content)) {
      content = msg.content
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && item.type === 'text') return item.text || '';
          return JSON.stringify(item);
        })
        .join('\n');
    }
    messages.push({
      role: msg.role,
      content: content || '',
    });
  }

  return {
    model: anthropicPayload.model,
    messages,
    max_tokens: anthropicPayload.max_tokens,
    temperature: anthropicPayload.temperature,
    top_p: anthropicPayload.top_p,
    stream: anthropicPayload.stream ?? false,
    stream_options: anthropicPayload.stream ? { include_usage: true } : undefined,
  };
}

/**
 * Converts non-streaming OpenAI chat completion response to Anthropic message format.
 */
export function openAiToAnthropicResponse(openAiResJson: any): any {
  const contentText = openAiResJson.choices?.[0]?.message?.content || '';
  const stopReason = openAiResJson.choices?.[0]?.finish_reason === 'stop' ? 'end_turn' : 'max_tokens';

  return {
    id: openAiResJson.id || `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    model: openAiResJson.model,
    content: [
      {
        type: 'text',
        text: contentText,
      },
    ],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: openAiResJson.usage?.prompt_tokens || 0,
      output_tokens: openAiResJson.usage?.completion_tokens || 0,
    },
  };
}

/**
 * Creates a TransformStream that converts an OpenAI SSE stream into an Anthropic SSE stream.
 */
export function createOpenAiToAnthropicSseTransform(modelName: string): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';
  let msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let hasSentMessageStart = false;
  let hasSentContentBlockStart = false;

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          controller.enqueue(
            encoder.encode(
              `event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":0}}\n\n` +
              `event: message_stop\ndata: {"type":"message_stop"}\n\n`
            )
          );
          continue;
        }

        try {
          const parsed = JSON.parse(dataStr);

          // 1. Emit message_start on first chunk
          if (!hasSentMessageStart) {
            hasSentMessageStart = true;
            msgId = parsed.id || msgId;
            const startEvent = {
              type: 'message_start',
              message: {
                id: msgId,
                type: 'message',
                role: 'assistant',
                model: parsed.model || modelName,
                content: [],
                stop_reason: null,
                stop_sequence: null,
                usage: { input_tokens: parsed.usage?.prompt_tokens || 0, output_tokens: 0 },
              },
            };
            controller.enqueue(encoder.encode(`event: message_start\ndata: ${JSON.stringify(startEvent)}\n\n`));
          }

          // 2. Emit content_block_start on first content delta
          const textChunk = parsed.choices?.[0]?.delta?.content;
          if (textChunk !== undefined && textChunk !== null) {
            if (!hasSentContentBlockStart) {
              hasSentContentBlockStart = true;
              const blockStartEvent = {
                type: 'content_block_start',
                index: 0,
                content_block: { type: 'text', text: '' },
              };
              controller.enqueue(encoder.encode(`event: content_block_start\ndata: ${JSON.stringify(blockStartEvent)}\n\n`));
            }

            const deltaEvent = {
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: textChunk },
            };
            controller.enqueue(encoder.encode(`event: content_block_delta\ndata: ${JSON.stringify(deltaEvent)}\n\n`));
          }

          // 3. Emit usage updates if present in chunk
          if (parsed.usage) {
            const usageEvent = {
              type: 'message_delta',
              delta: { stop_reason: 'end_turn', stop_sequence: null },
              usage: { output_tokens: parsed.usage.completion_tokens || 0 },
            };
            controller.enqueue(encoder.encode(`event: message_delta\ndata: ${JSON.stringify(usageEvent)}\n\n`));
          }
        } catch {
          // Ignore invalid JSON SSE chunks
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        // Drain any remaining buffer if needed
      }
    },
  });
}
