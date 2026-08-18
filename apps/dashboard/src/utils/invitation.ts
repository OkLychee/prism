import { formatTimestamp } from './date';

export interface GenerateInvitationParams {
  candidateName: string;
  apiKey: string;
  quotaType: 'tokens' | 'usd';
  quotaLimit: number;
  allowedModels: string[];
  expiresAt: number | string;
  lang?: string;
}

export function getGatewayBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace('5173', '8787') + '/openai/v1';
  }
  return 'http://localhost:8787/openai/v1';
}

export function getAnthropicBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace('5173', '8787') + '/anthropic/v1';
  }
  return 'http://localhost:8787/anthropic/v1';
}

export function getAgentGuides(key: string, allowedModels: string[] = []) {
  const baseUrl = getGatewayBaseUrl();
  const anthropicBaseUrl = getAnthropicBaseUrl();

  const parsedModels = allowedModels.length > 0
    ? allowedModels.map(m => m.includes('::') ? m.split('::')[1] : m)
    : [];

  const defaultModel = parsedModels.length > 0 ? parsedModels[0] : 'gpt-4o';
  const availableModelsHint = parsedModels.length > 0
    ? parsedModels.map(m => `"${m}"`).join(' | ')
    : '"gpt-4o" | "gpt-4o-mini"';

  return {
    claudeCode: {
      name: 'Claude Code CLI',
      config: `1. Edit ~/.claude/settings.json:
{
  "env": {
    "ANTHROPIC_BASE_URL": "${anthropicBaseUrl}",
    "ANTHROPIC_AUTH_TOKEN": "${key}",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"
  }
}

2. Edit ~/.claude.json:
{
  "hasCompletedOnboarding": true
}`,
      unset: `Remove ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from ~/.claude/settings.json`
    },
    codex: {
      name: 'Codex CLI / Desktop',
      config: `Edit ~/.codex/config.toml:
# Pick any authorized model: ${availableModelsHint}
model = "${defaultModel}"
model_provider = "prism"
model_context_window = 1000000

[model_providers.prism]
name = "Prism"
base_url = "${baseUrl}"
experimental_bearer_token = "${key}"
wire_api = "responses"`,
      unset: `Remove [model_providers.prism] configuration from ~/.codex/config.toml`
    },
    cursor: {
      name: 'Cursor IDE',
      config: `1. Open Settings -> Models\n2. Set OpenAI Base URL: ${baseUrl}\n3. Set OpenAI API Key: ${key}\n4. Enable custom model override`,
      unset: `Reset OpenAI Base URL and API Key in Cursor Settings.`
    },
    aider: {
      name: 'Aider CLI',
      config: `export OPENAI_API_BASE="${baseUrl}"\nexport OPENAI_API_KEY="${key}"\naider --model openai/gpt-4o`,
      unset: `unset OPENAI_API_BASE\nunset OPENAI_API_KEY`
    }
  };
}

export function generateMarkdownInvitation(params: GenerateInvitationParams): string {
  const { candidateName, apiKey, quotaType, quotaLimit, allowedModels, expiresAt, lang = 'zh-CN' } = params;
  const guides = getAgentGuides(apiKey, allowedModels);
  const isZh = lang === 'zh-CN';

  const expiresText = typeof expiresAt === 'number' 
    ? formatTimestamp(expiresAt) 
    : expiresAt.replace('T', ' ');

  const parsedModelsList = allowedModels.length > 0
    ? allowedModels.map(m => m.includes('::') ? m.split('::')[1] : m)
    : [];

  const modelsText = parsedModelsList.length > 0
    ? parsedModelsList.join(', ')
    : (isZh ? '所有默认授权模型' : 'All Default Models');

  const selectedCodexModel = parsedModelsList.length > 0 ? parsedModelsList[0] : 'gpt-4o';
  const codexModelsCommentZh = parsedModelsList.length > 0
    ? `# 可选授权模型: ${parsedModelsList.map(m => `"${m}"`).join(', ')}`
    : `# 可填入任意授权模型，如 "gpt-4o"`;
  const codexModelsCommentEn = parsedModelsList.length > 0
    ? `# Available authorized models: ${parsedModelsList.map(m => `"${m}"`).join(', ')}`
    : `# Specify any authorized model, e.g. "gpt-4o"`;

  if (isZh) {
    return `### AI Coding 面试邀请函 & 环境准备指引

尊敬的 **${candidateName}**：

欢迎参加本次技术面试！为了方便您在面试中使用自己最熟悉的 Coding Agent 辅助开发，我们为您提供了专用 AI 网关密钥：

- **专属 API Key**: \`${apiKey}\`
- **额度限制**: ${quotaType === 'tokens' ? `${quotaLimit.toLocaleString()} Tokens` : `$${quotaLimit} USD`}
- **授权模型**: ${modelsText}
- **有效期限**: ${expiresText}

> ⚠️ **隐私与评估说明**：请注意，本 API Key 的全部使用记录与交互 Prompt 将会被完整记录，以便面试官在面试后进行评估与复盘。

---

#### 🚀 快速配置指引

##### 1. Claude Code CLI
1. 编辑配置文件 \`~/.claude/settings.json\`：
\`\`\`json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${getAnthropicBaseUrl()}",
    "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"
  }
}
\`\`\`
2. 编辑或新建 \`~/.claude.json\` 添加 onboarding 标记：
\`\`\`json
{
  "hasCompletedOnboarding": true
}
\`\`\`

##### 2. Codex CLI / Desktop
编辑配置文件 \`~/.codex/config.toml\`（可在授权模型列表中自由切换填入 \`model\`）：
\`\`\`toml
${codexModelsCommentZh}
model = "${selectedCodexModel}"
model_provider = "prism"
model_context_window = 1000000

[model_providers.prism]
name = "Prism"
base_url = "${getGatewayBaseUrl()}"
experimental_bearer_token = "${apiKey}"
wire_api = "responses"
\`\`\`

##### 3. Aider CLI
\`\`\`bash
${guides.aider.config}
\`\`\`

---

#### 🧹 面试完成后的还原配置指引 (Unset)
面试结束后，您可以恢复个人原有的配置文件：
- **Claude Code**: 删除 \`~/.claude/settings.json\` 中添加的 \`ANTHROPIC_BASE_URL\` 与 \`ANTHROPIC_AUTH_TOKEN\`。
- **Codex**: 删除 \`~/.codex/config.toml\` 中添加的 \`[model_providers.prism]\` 及对应关联配置。

祝您面试顺利！
`;
  } else {
    return `### AI Coding Interview Invitation & Environment Guide

Dear **${candidateName}**:

Welcome to the technical interview! To let you utilize your favorite AI Coding Agent during the interview, here is your dedicated API Gateway key:

- **Dedicated API Key**: \`${apiKey}\`
- **Quota**: ${quotaType === 'tokens' ? `${quotaLimit.toLocaleString()} Tokens` : `$${quotaLimit} USD`}
- **Allowed Models**: ${modelsText}
- **Valid Until**: ${expiresText}

> ⚠️ **Privacy & Evaluation Notice**: Please note that all usage logs and interaction prompts of this API Key will be fully recorded for interviewer review and evaluation.

---

#### 🚀 Setup Guide

##### 1. Claude Code CLI
1. Edit \`~/.claude/settings.json\`:
\`\`\`json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${getAnthropicBaseUrl()}",
    "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"
  }
}
\`\`\`
2. Edit or create \`~/.claude.json\`:
\`\`\`json
{
  "hasCompletedOnboarding": true
}
\`\`\`

##### 2. Codex CLI / Desktop
Edit \`~/.codex/config.toml\` (choose any authorized model for \`model\`):
\`\`\`toml
${codexModelsCommentEn}
model = "${selectedCodexModel}"
model_provider = "prism"
model_context_window = 1000000

[model_providers.prism]
name = "Prism"
base_url = "${getGatewayBaseUrl()}"
experimental_bearer_token = "${apiKey}"
wire_api = "responses"
\`\`\`

##### 3. Aider CLI
\`\`\`bash
${guides.aider.config}
\`\`\`

---

#### 🧹 Post-Interview Cleanup Guide (Unset)
After the interview, clean up configuration files:
- **Claude Code**: Remove \`ANTHROPIC_BASE_URL\` & \`ANTHROPIC_AUTH_TOKEN\` from \`~/.claude/settings.json\`.
- **Codex**: Remove \`[model_providers.prism]\` configuration from \`~/.codex/config.toml\`.

Good luck with your interview!
`;
  }
}
