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

export function getAgentGuides(key: string) {
  const baseUrl = getGatewayBaseUrl();
  const anthropicBaseUrl = getAnthropicBaseUrl();

  return {
    claudeCode: {
      name: 'Claude Code CLI',
      config: `export ANTHROPIC_BASE_URL="${anthropicBaseUrl}"\nexport ANTHROPIC_API_KEY="${key}"`,
      unset: `unset ANTHROPIC_BASE_URL\nunset ANTHROPIC_API_KEY`
    },
    codex: {
      name: 'Codex CLI / OpenAI CLI',
      config: `export OPENAI_BASE_URL="${baseUrl}"\nexport OPENAI_API_KEY="${key}"`,
      unset: `unset OPENAI_BASE_URL\nunset OPENAI_API_KEY`
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
  const guides = getAgentGuides(apiKey);
  const isZh = lang === 'zh-CN';

  const expiresText = typeof expiresAt === 'number' 
    ? formatTimestamp(expiresAt) 
    : expiresAt.replace('T', ' ');

  const modelsText = allowedModels.length > 0
    ? allowedModels.map(m => m.includes('::') ? m.split('::')[1] : m).join(', ')
    : (isZh ? '所有默认授权模型' : 'All Default Models');

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

#### 🚀 快速配置指引 (终端一键粘贴)

##### 1. Claude Code CLI
\`\`\`bash
${guides.claudeCode.config}
\`\`\`

##### 2. Codex / OpenAI 兼容 CLI
\`\`\`bash
${guides.codex.config}
\`\`\`

##### 3. Aider CLI
\`\`\`bash
${guides.aider.config}
\`\`\`

---

#### 🧹 面试完成后的还原配置指引 (Unset)
面试结束后，您可以通过以下命令快速恢复个人原有的环境变量配置：
\`\`\`bash
# 还原 Claude Code 配置
${guides.claudeCode.unset}

# 还原 OpenAI / Codex 配置
${guides.codex.unset}
\`\`\`

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

#### 🚀 Setup Guide (Copy & Paste to Terminal)

##### 1. Claude Code CLI
\`\`\`bash
${guides.claudeCode.config}
\`\`\`

##### 2. Codex / OpenAI CLI
\`\`\`bash
${guides.codex.config}
\`\`\`

##### 3. Aider CLI
\`\`\`bash
${guides.aider.config}
\`\`\`

---

#### 🧹 Post-Interview Cleanup Guide (Unset)
After the interview, run these commands to restore your local environment variables:
\`\`\`bash
# Restore Claude Code
${guides.claudeCode.unset}

# Restore OpenAI / Codex
${guides.codex.unset}
\`\`\`

Good luck with your interview!
`;
  }
}
