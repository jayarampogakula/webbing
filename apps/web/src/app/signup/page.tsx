"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          tenantName: tenantName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
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
      
      {/* Decorative Blur Orbs */}
      <div style={{ position: "absolute", width: "300px", height: "300px", background: "rgba(99, 102, 241, 0.15)", borderRadius: "50%", filter: "blur(80px)", top: "10%", left: "15%", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "300px", height: "300px", background: "rgba(217, 70, 239, 0.15)", borderRadius: "50%", filter: "blur(80px)", bottom: "10%", right: "15%", zIndex: 0, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 1 }}>
        
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a href="/" style={{ fontSize: "2rem", fontWeight: "bold", background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>Webbing</a>
          <p style={{ color: "#9ca3af", marginTop: "0.5rem", fontSize: "0.9rem" }}>Create your account to start building websites with AI</p>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "2.5rem 2rem", borderRadius: "1.25rem", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)", backdropFilter: "blur(20px)" }}>
          <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>Get Started for Free</h2>

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.85rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Full Name *</label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                className="premium-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Email Address *</label>
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
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Password *</label>
              <input 
                type="password" 
                placeholder="Minimum 6 characters" 
                className="premium-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: 600 }}>Workspace Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Acme Corp Studio" 
                className="premium-input"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={loading}
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
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
          
          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
            Already have an account?{" "}
            <a href="/signin" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>Sign In</a>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{ fontSize: "0.85rem", color: "#6366f1", textDecoration: "none" }}>← Back to Landing Page</a>
        </div>
      </div>
    </div>
  );
}
