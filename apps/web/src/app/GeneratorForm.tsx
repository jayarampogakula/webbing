"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Globe, Sparkle } from "lucide-react";

interface GeneratorFormProps {
  user: { userId: string; email: string; role: string; tenantId: string } | null;
}

export default function GeneratorForm({ user }: GeneratorFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Modern Dark Style");
  const [ecommerce, setEcommerce] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ projectId: string; subdomain: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!user) {
      setError("You must be signed in to generate a website. Redirecting to Sign In...");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
      return;
    }

    if (!name.trim()) {
      setError("Please enter a name for your website.");
      return;
    }
    if (!niche.trim()) {
      setError("Please specify your website's niche (e.g., Restaurant, Portfolio).");
      return;
    }
    if (prompt.trim().length < 5) {
      setError("Please write a description of at least 5 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          niche: niche.trim(),
          prompt: prompt.trim(),
          style,
          colors: style.includes("Light") ? "#ffffff" : "#0f172a",
          ecommerce,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate website.");
      }

      setSuccess({
        projectId: data.projectId,
        subdomain: data.subdomain,
      });
      // Clear inputs
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
    <div style={{ maxWidth: "780px", margin: "0 auto", textAlign: "left" }}>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "2.5rem", borderRadius: "1.5rem", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(20px)" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Sparkle size={20} color="#a855f7" />
          <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>Generate Your AI Website</h3>
        </div>
        
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1.5rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>Success! Your website is being built 🪄</h4>
            <p style={{ margin: "0 0 1rem 0", color: "#a7f3d0", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Our background worker is constructing your pages, copy, layout, and theme structure asynchronously.
            </p>
            <a 
              href={`http://${success.subdomain}.localhost:3000`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#10b981", color: "#ffffff", padding: "0.6rem 1.25rem", borderRadius: "0.5rem", fontWeight: 700, textDecoration: "none", fontSize: "0.85rem", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
            >
              <Globe size={16} /> Visit {success.subdomain}.localhost:3000 ↗
            </a>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.02em" }}>WEBSITE NAME</label>
            <input 
              type="text" 
              placeholder="e.g. My Vegan Bistro" 
              className="premium-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.02em" }}>NICHE/CATEGORY</label>
            <input 
              type="text" 
              placeholder="e.g. Restaurant, Agency" 
              className="premium-input"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.02em" }}>DESCRIBE YOUR BUSINESS, STYLE, AND REQUIREMENTS</label>
          <textarea 
            placeholder="e.g. A modern vegan restaurant in Seattle with a dark theme, organic color palette, clean font, and table booking widget..." 
            className="premium-input"
            style={{ height: "110px", resize: "none", lineHeight: 1.5 }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <select 
                className="premium-input" 
                style={{ padding: "0.6rem 2rem 0.6rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", background: "rgba(255, 255, 255, 0.02)" }}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={loading}
              >
                <option value="Modern Dark Style" style={{ background: "#111827", color: "#ffffff" }}>Modern Dark Style</option>
                <option value="Clean Light Minimalist" style={{ background: "#111827", color: "#ffffff" }}>Clean Light Minimalist</option>
                <option value="Bold Colorful Vibrant" style={{ background: "#111827", color: "#ffffff" }}>Bold Colorful Vibrant</option>
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", color: "#f3f4f6", cursor: "pointer", userSelect: "none", fontWeight: 600 }}>
              <input 
                type="checkbox" 
                style={{ accentColor: "#6366f1", width: "18px", height: "18px", cursor: "pointer" }} 
                checked={ecommerce}
                onChange={(e) => setEcommerce(e.target.checked)}
                disabled={loading}
              /> 
              Include E-Commerce
            </label>
          </div>

          <button 
            type="submit"
            className="glow-btn"
            style={{ 
              background: loading ? "rgba(99, 102, 241, 0.4)" : "linear-gradient(to right, #6366f1, #d946ef)", 
              border: "none", 
              color: "#ffffff", 
              padding: "0.9rem 2.25rem", 
              borderRadius: "0.75rem", 
              cursor: loading ? "not-allowed" : "pointer", 
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.9rem",
              boxShadow: "0 4px 15px rgba(217, 70, 239, 0.3)" 
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin" style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Layout...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Website
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
