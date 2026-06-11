"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, KeyRound, Globe, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [appName, setAppName] = useState("Webbing");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/setup")
      .then(res => res.json())
      .then(data => {
        setSetupRequired(data.setupRequired);
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (adminPassword !== confirmPassword) {
      setError("Admin passwords do not match.");
      return;
    }

    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName.trim(),
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Installation configuration failed.");
      
      setMessage("Configuration saved successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/signin");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred finalizing configuration.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#060914", color: "#f8fafc", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2rem", height: "2rem", border: "3px solid rgba(255,255,255,0.05)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Checking platform installation state...</span>
        </div>
      </div>
    );
  }

  if (!setupRequired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#060914", color: "#f8fafc", fontFamily: "'Outfit', 'Inter', sans-serif", padding: "2rem" }}>
        <div className="glass-panel" style={{ padding: "3rem 2.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", maxWidth: "480px", textAlign: "center", background: "rgba(10,14,23,0.95)" }}>
          <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(52, 211, 153, 0.1)", color: "#34d399", marginBottom: "1.5rem" }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: "0 0 0.5rem 0", background: "linear-gradient(to right, #34d399, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Platform Configuration Secure</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 2rem 0" }}>
            The SaaS platform configuration has already been finalized. Default developer credentials have been disabled or replaced.
          </p>
          <button onClick={() => router.push("/signin")} className="primary-action" style={{ width: "100%", justifyContent: "center" }}>
            Sign In Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#060914", color: "#f8fafc", fontFamily: "'Outfit', 'Inter', sans-serif", padding: "3rem 1.5rem" }}>
      <div className="auth-shell" style={{ display: "flex", gap: "3rem", flexWrap: "wrap", justifyContent: "center", maxWidth: "1000px", width: "100%" }}>
        
        {/* Left Side: Copy and Steps */}
        <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <a className="brand" href="/" style={{ fontSize: "1.4rem", fontWeight: 800, textDecoration: "none", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="brand-mark" style={{ background: "linear-gradient(to right, #6366f1, #a855f7)", padding: "0.35rem", borderRadius: "0.375rem", display: "flex", color: "#fff" }}><Sparkles size={16} /></span>
            {appName || "Webbing"}
          </a>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.1, margin: 0 }}>Install & Configure Your SaaS</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
            Configure custom admin login credentials and platform branding parameters. All local configurations are preserved and will not be overwritten by future releases.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <CheckCircle2 size={16} style={{ color: "#818cf8", marginTop: "0.15rem" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Deploy database migrations</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Prisma client schema successfully loaded</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <KeyRound size={16} style={{ color: "#a855f7", marginTop: "0.15rem" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Define platform credentials</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Choose custom email & secure hashed passwords</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <Globe size={16} style={{ color: "#34d399", marginTop: "0.15rem" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Custom SaaS Name</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Choose how the platform is branded dynamically</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Setup Form Card */}
        <form onSubmit={handleSetupSubmit} className="glass-panel auth-card" style={{ flex: 1.2, minWidth: "320px", padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1.25rem", background: "rgba(10,14,23,0.95)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>Platform Setup</h2>
          
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {message && (
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={15} /> {message}
            </div>
          )}

          <div className="field-group">
            <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>SaaS Platform Branding Name</label>
            <input 
              className="field" 
              type="text" 
              value={appName} 
              onChange={(e) => setAppName(e.target.value)} 
              placeholder="e.g. Webbing" 
              disabled={loading} 
              required 
            />
          </div>

          <div className="field-group">
            <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Administrator Full Name</label>
            <input 
              className="field" 
              type="text" 
              value={adminName} 
              onChange={(e) => setAdminName(e.target.value)} 
              placeholder="e.g. John Doe" 
              disabled={loading} 
              required 
            />
          </div>

          <div className="field-group">
            <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Administrator Custom Email</label>
            <input 
              className="field" 
              type="email" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)} 
              placeholder="e.g. admin@yourdomain.com" 
              disabled={loading} 
              required 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="field-group-row">
            <div className="field-group">
              <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Admin Password</label>
              <input 
                className="field" 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)} 
                placeholder="Choose password" 
                disabled={loading} 
                required 
              />
            </div>
            <div className="field-group">
              <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Confirm Password</label>
              <input 
                className="field" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repeat password" 
                disabled={loading} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-action" 
            style={{ width: "100%", marginTop: "0.75rem", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", border: 0, justifyContent: "center" }} 
            disabled={loading}
          >
            {loading ? "Saving Platform Configurations..." : "Finalize Installation"}
          </button>
        </form>

      </div>
    </div>
  );
}
