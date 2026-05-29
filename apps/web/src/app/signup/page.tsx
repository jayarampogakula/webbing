"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, UserPlus } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";

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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, tenantName: tenantName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <MarketingHeader active="signup" />
      <div className="auth-shell">
        <div className="auth-copy">
          <a className="brand" href="/">
            <span className="brand-mark"><Sparkles size={18} /></span>
            Webbing
          </a>
          <h1>Start your AI website workspace.</h1>
          <p>Create an account, generate your first site, and add your own LLM keys from the dashboard when you need custom routing.</p>
          <div className="hero-stats">
            <div className="stat-tile"><strong>Free</strong><span>starter plan</span></div>
            <div className="stat-tile"><strong>BYOK</strong><span>user keys</span></div>
            <div className="stat-tile"><strong>SSL</strong><span>domain ready</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-card">
          <h2>Create account</h2>
          {error && <div className="form-alert">{error}</div>}
          <div className="field-group">
            <label>Full name</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={loading} required />
          </div>
          <div className="field-group" style={{ marginTop: "1rem" }}>
            <label>Email address</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} required />
          </div>
          <div className="field-group" style={{ marginTop: "1rem" }}>
            <label>Password</label>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" disabled={loading} required />
          </div>
          <div className="field-group" style={{ marginTop: "1rem" }}>
            <label>Workspace name</label>
            <input className="field" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Acme Studio" disabled={loading} />
          </div>
          <button className="primary-action" style={{ width: "100%", marginTop: "1.25rem" }} disabled={loading}>
            <UserPlus size={17} />
            {loading ? "Creating account" : "Sign up"}
          </button>
          <div className="auth-links">Already have an account? <a href="/signin">Sign in</a></div>
        </form>
      </div>
    </div>
  );
}
