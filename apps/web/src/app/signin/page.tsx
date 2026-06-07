"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import MarketingHeader from "../components/MarketingHeader";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { settings } = useSystemSettings();

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
      if (!res.ok) throw new Error(data.error || "Invalid credentials.");
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
      <MarketingHeader active="signin" />
      <div className="auth-shell">
        <div className="auth-copy">
          <a className="brand" href="/">
            {settings.appLogo ? (
              <img src={settings.appLogo} alt={settings.appName} style={{ height: "24px", maxWidth: "100px", objectFit: "contain", marginRight: "0.25rem" }} />
            ) : (
              <span className="brand-mark"><Sparkles size={18} /></span>
            )}
            {settings.appName}
          </a>
          <h1>Welcome back to your builder.</h1>
          <p>Sign in to manage generated websites, credits, provider keys, domains, and publishing status.</p>
          <div className="demo-box">
            <strong>Demo accounts</strong>
            <div>Admin: admin@webbing.in / Admin123</div>
            <div>User: user@webbing.in / User123</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-card">
          <h2>Sign in</h2>
          {error && <div className="form-alert">{error}</div>}
          <div className="field-group">
            <label>Email address</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} required />
          </div>
          <div className="field-group" style={{ marginTop: "1rem" }}>
            <label>Password</label>
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" disabled={loading} required />
          </div>
          <button className="primary-action" style={{ width: "100%", marginTop: "1.25rem" }} disabled={loading}>
            <LogIn size={17} />
            {loading ? "Signing in" : "Sign in"}
          </button>
          <div className="auth-links">Need an account? <a href="/signup">Sign up</a></div>
        </form>
      </div>
    </div>
  );
}
