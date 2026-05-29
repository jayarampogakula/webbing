"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";

type Scope = "GLOBAL" | "USER";

export type LlmKeyView = {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  baseUrl?: string | null;
  model?: string | null;
  scope: Scope;
  ownerUserId?: string | null;
  isActive: boolean;
  createdAt: Date | string;
};

const providerOptions = [
  ["OPENAI", "OpenAI"],
  ["GEMINI", "Gemini"],
  ["CLAUDE", "Claude"],
  ["DEEPSEEK", "DeepSeek"],
  ["MINIMAX", "MiniMax"],
  ["KIMI", "Kimi"],
  ["MISTRAL", "Mistral"],
  ["GROQ", "Groq"],
  ["COHERE", "Cohere"],
  ["OPENROUTER", "OpenRouter"],
  ["CUSTOM", "Custom"],
];

export default function LlmKeyManager({
  initialKeys,
  canAddGlobal,
  title,
  description,
}: {
  initialKeys: LlmKeyView[];
  canAddGlobal?: boolean;
  title: string;
  description: string;
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [provider, setProvider] = useState("OPENAI");
  const [scope, setScope] = useState<Scope>(canAddGlobal ? "GLOBAL" : "USER");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/llm-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, scope, label, apiKey, model, baseUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save key.");

      setKeys((current) => [data.key, ...current]);
      setLabel("");
      setApiKey("");
      setModel("");
      setBaseUrl("");
    } catch (err: any) {
      setError(err.message || "Could not save key.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteKey(id: string) {
    setError("");
    const res = await fetch(`/api/llm-keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete key.");
      return;
    }
    setKeys((current) => current.filter((key) => key.id !== id));
  }

  return (
    <section className="surface-panel llm-manager">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">LLM routing</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="provider-strip">
          {providerOptions.slice(0, 6).map((item) => (
            <span key={item[0]}>{item[1]}</span>
          ))}
        </div>
      </div>

      <form onSubmit={saveKey} className="key-form">
        <select className="field" value={provider} onChange={(e) => setProvider(e.target.value)}>
          {providerOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {canAddGlobal && (
          <select className="field" value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
            <option value="GLOBAL">Admin global key</option>
            <option value="USER">User-owned key</option>
          </select>
        )}
        <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Claude production" required />
        <input className="field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" type="password" required />
        <input className="field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Default model (optional)" />
        <input className="field" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Base URL for custom providers" />
        <button className="primary-action" disabled={loading}>
          <Plus size={16} />
          {loading ? "Saving..." : "Add key"}
        </button>
      </form>

      {error && <div className="form-alert">{error}</div>}

      <div className="key-grid">
        {keys.length === 0 ? (
          <div className="empty-state">No LLM keys saved yet.</div>
        ) : (
          keys.map((key) => (
            <div className="key-card" key={key.id}>
              <div className="key-card-top">
                <span className="key-icon">
                  <KeyRound size={17} />
                </span>
                <div>
                  <strong>{key.label}</strong>
                  <small>{providerOptions.find(([value]) => value === key.provider)?.[1] || key.provider}</small>
                </div>
              </div>
              <code>{key.maskedKey}</code>
              <div className="key-meta">
                <span>{key.scope === "GLOBAL" ? "Admin global" : "User key"}</span>
                {key.model && <span>{key.model}</span>}
              </div>
              <button type="button" className="icon-danger" onClick={() => deleteKey(key.id)} aria-label={`Delete ${key.label}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
