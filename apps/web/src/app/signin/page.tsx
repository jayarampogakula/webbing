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
  
  // Forgot Password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");
    setLoading(true);

    if (!forgotEmail.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit recovery request.");
      setForgotSuccess(data.message || "Instructions sent successfully.");
      setForgotEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
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
        </div>

        {forgotMode ? (
          <form onSubmit={handleForgotSubmit} className="auth-card">
            <h2>Recover Password</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "-0.5rem 0 1rem 0", lineHeight: 1.4 }}>
              Enter your email address. If registered, we will send you a temporary password.
            </p>
            {error && <div className="form-alert" style={{ marginBottom: "1rem" }}>{error}</div>}
            {forgotSuccess && (
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {forgotSuccess}
              </div>
            )}
            <div className="field-group">
              <label>Email address</label>
              <input className="field" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" disabled={loading} required />
            </div>
            <button className="primary-action" style={{ width: "100%", marginTop: "1.25rem", justifyContent: "center" }} disabled={loading}>
              {loading ? "Sending Password..." : "Send Temporary Password"}
            </button>
            <div className="auth-links">
              Remembered your password? <button type="button" onClick={() => { setForgotMode(false); setError(""); setForgotSuccess(""); }} style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.85rem", cursor: "pointer", padding: 0, fontWeight: 700 }}>Sign in</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-card">
            <h2>Sign in</h2>
            {error && <div className="form-alert">{error}</div>}
            <div className="field-group">
              <label>Email address</label>
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} required />
            </div>
            <div className="field-group" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <label style={{ margin: 0 }}>Password</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(""); setForgotSuccess(""); }} style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>Forgot password?</button>
              </div>
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" disabled={loading} required />
            </div>
            <button className="primary-action" style={{ width: "100%", marginTop: "1.25rem" }} disabled={loading}>
              <LogIn size={17} />
              {loading ? "Signing in" : "Sign in"}
            </button>
            <div className="auth-links">Need an account? <a href="/signup">Sign up</a></div>
          </form>
        )}
      </div>
    </div>
  );
}
