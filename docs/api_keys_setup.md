# API Keys Setup and LLM Configuration Guide

Webbing is designed to run with multiple AI models and providers. This guide explains how to configure LLM API keys for administrators and standard users.

---

## 🛠️ Provider Keys Configuration

To generate layout structures, copywriting features, and visual theme mappings, Webbing routes requests to OpenAI, Google Gemini, or Anthropic Claude. 

You can configure keys in two locations:

### 1. Host Environment Variables (Root `.env` file)
You can define keys as default fallback credentials when setting up your VPS:
```env
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AIzaSy..."
```

### 2. Admin Console UI (Database Keys)
1. Log in to the administrator account and navigate to the **Admin Console > API Keys**.
2. Click **Add API Key**:
   * **Provider**: Select `OPENAI`, `GEMINI`, or `CLAUDE`.
   * **Custom Label**: Give the key a descriptive identifier.
   * **API Key**: Enter the API key.
   * **API Base URL**: Enter a custom endpoint URL (useful for local models, OpenRouter, or reverse proxy APIs like LM Studio).
   * **Model Identifier**: Customize which model to target (e.g. `gpt-4o`, `gemini-1.5-pro`, or `claude-3-5-sonnet-20240620`).
   * **Scope**:
     * **GLOBAL (Admin)**: The key will be used globally to power website generations for free-tier users or users without custom keys.
     * **USER (Individual)**: The key belongs strictly to a specific user.

---

## 🔒 Scope & Security Controls
* **Admin Key Protection**: Global administrator API keys are filtered and protected. They are never sent to frontend client interfaces or standard user console configs, preventing key leaks.
* **User Custom Keys**: Standard users can add their own keys inside their **Settings** panel. When a user configures their own active LLM key, the platform automatically routes generation and refinement commands through their custom LLM key instead of using the admin's global key.

---

## ⚡ AI Credits Limit Bypass
* When a user brings their own provider keys (e.g., configuring their own OpenAI or Gemini key), the system detects this on generation requests.
* The system **bypasses credit limit checks** and does not increment `creditsUsed` for their account, allowing unlimited generation and edits while utilizing their own billing limits.
