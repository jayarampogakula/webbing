"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Sparkles } from "lucide-react";

interface GeneratorFormProps {
  user: { userId: string; email: string; role: string; tenantId: string } | null;
}

export default function GeneratorForm({ user }: GeneratorFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Modern Editorial");
  const [ecommerce, setEcommerce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ projectId: string; subdomain: string } | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [siteDisplay, setSiteDisplay] = useState("");

  React.useEffect(() => {
    if (success && typeof window !== "undefined") {
      const host = window.location.host;
      const cleanHost = host.startsWith("app.") ? host.substring(4) : host;
      const protocol = host.includes("localhost") ? "http:" : window.location.protocol;
      setSiteUrl(`${protocol}//${success.subdomain}.${cleanHost}`);
      setSiteDisplay(`${success.subdomain}.${cleanHost}`);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!user) {
      setError("Sign in to generate and publish your website.");
      setTimeout(() => router.push("/signin"), 900);
      return;
    }

    if (!name.trim() || !niche.trim() || prompt.trim().length < 5) {
      setError("Add a website name, niche, and a short description.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          niche: niche.trim(),
          prompt: prompt.trim(),
          style,
          colors: style.includes("Light") ? "#f8fafc" : "#07111b",
          ecommerce,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate website.");

      setSuccess({ projectId: data.projectId, subdomain: data.subdomain });
      setName("");
      setNiche("");
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-panel generator-card">
      <div className="section-heading-row">
        <div>
          <span className="eyebrow">AI site builder</span>
          <h2>Generate a complete website</h2>
          <p>Home, features, pricing, about, contact, and commerce-ready sections in one guided build.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}

      {success && (
        <div className="success-alert">
          <strong>Your website is being built.</strong>
          <p>Pages, sections, copy, and theme settings are being prepared in the background.</p>
          <a className="secondary-action" href={siteUrl || "#"} target="_blank" rel="noopener noreferrer">
            <Globe size={16} />
            Visit {siteDisplay || "website"}
          </a>
        </div>
      )}

      <div className="form-grid">
        <div className="field-group">
          <label>Website name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Studio" disabled={loading} />
        </div>
        <div className="field-group">
          <label>Niche or category</label>
          <input className="field" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Agency, restaurant, SaaS" disabled={loading} />
        </div>
      </div>

      <div className="field-group" style={{ marginTop: "1rem" }}>
        <label>Business, style, and requirements</label>
        <textarea
          className="field"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the offer, audience, tone, pages, colors, and any features you want included."
          rows={5}
          disabled={loading}
        />
      </div>

      <div className="form-grid" style={{ marginTop: "1rem", alignItems: "end" }}>
        <div className="field-group">
          <label>Design direction</label>
          <select className="field" value={style} onChange={(e) => setStyle(e.target.value)} disabled={loading}>
            <option value="Modern Editorial">Modern Editorial</option>
            <option value="Clean Light Minimalist">Clean Light Minimalist</option>
            <option value="Bold Product Launch">Bold Product Launch</option>
            <option value="Warm Local Business">Warm Local Business</option>
          </select>
        </div>
        <label className="secondary-action" style={{ justifyContent: "flex-start" }}>
          <input type="checkbox" checked={ecommerce} onChange={(e) => setEcommerce(e.target.checked)} disabled={loading} />
          Include e-commerce
        </label>
      </div>

      <button className="primary-action" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
        {loading ? (
          <>
            <span className="animate-spin">◌</span>
            Generating website
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate website
          </>
        )}
      </button>
    </form>
  );
}
