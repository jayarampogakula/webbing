"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials.");
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle at top left, #111827, #030712)", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "450px" }}>
        
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a href="/" style={{ fontSize: "2rem", fontWeight: "bold", background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>Webbing</a>
          <p style={{ color: "#9ca3af", marginTop: "0.5rem", fontSize: "0.9rem" }}>Sign in to build and manage your AI-powered websites</p>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "2.5rem 2rem", borderRadius: "1.25rem", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)", backdropFilter: "blur(20px)" }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>Welcome Back</h2>

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.85rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                className="premium-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Password</label>
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="premium-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit"
              className="glow-btn"
              style={{ 
                background: "linear-gradient(to right, #6366f1, #3b82f6)", 
                border: "none", 
                color: "#ffffff", 
                padding: "0.85rem", 
                borderRadius: "0.75rem", 
                cursor: loading ? "not-allowed" : "pointer", 
                fontWeight: 600,
                marginTop: "0.5rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)" 
              }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </div>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="glass-card" style={{ marginTop: "1.5rem", padding: "1rem 1.5rem", borderRadius: "0.75rem", fontSize: "0.85rem", color: "#9ca3af", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <strong style={{ color: "#ffffff" }}>Demo Accounts:</strong>
          <div style={{ marginTop: "0.5rem", display: "grid", gridTemplateColumns: "1fr", gap: "0.25rem" }}>
            <div>🔑 <span style={{ color: "#818cf8" }}>Admin:</span> admin@webbing.in / AdminPassword123</div>
            <div>🔑 <span style={{ color: "#818cf8" }}>User:</span> user@webbing.in / UserPassword123</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{ fontSize: "0.85rem", color: "#6366f1", textDecoration: "none" }}>← Back to Landing Page</a>
        </div>
      </div>
    </div>
  );
}
