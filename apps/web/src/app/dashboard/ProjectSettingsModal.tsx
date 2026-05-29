"use client";

import React, { useState } from "react";
import { Settings, Check, Server } from "lucide-react";

interface ProjectSettingsModalProps {
  projectId: string;
  projectName: string;
  subdomain: string;
  currentCustomDomain: string | null;
  currentSelfHosted: boolean;
  subscriptionDomainType: string;
  subscriptionHostingType: string;
  baseDomain: string;
  protocol: string;
}

export default function ProjectSettingsModal({
  projectId,
  projectName,
  subdomain,
  currentCustomDomain,
  currentSelfHosted,
  subscriptionDomainType,
  subscriptionHostingType,
  baseDomain,
  protocol,
}: ProjectSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDomain, setCustomDomain] = useState(currentCustomDomain || "");
  const [selfHosted, setSelfHosted] = useState(currentSelfHosted);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");

  const handleVerifyDomain = async () => {
    setVerifying(true);
    setVerificationStatus("");
    try {
      const res = await fetch(`/api/projects/${projectId}/verify-domain`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify domain.");
      setVerificationStatus(data.message || (data.success ? "Verified!" : "Failed"));
      if (data.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setVerificationStatus(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: subscriptionDomainType === "CUSTOM" ? customDomain : undefined,
          selfHosted: (subscriptionHostingType === "THEIRS" || subscriptionHostingType === "BOTH") ? selfHosted : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update hosting configuration.");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const subdomainUrl = `${protocol}://${subdomain}.${baseDomain}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glow-btn"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#f3f4f6",
          padding: "0.4rem 0.8rem",
          borderRadius: "0.5rem",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        <Settings size={13} />
        Manage Hosting & Domain
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(3, 7, 18, 0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              position: "relative",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="eyebrow">Website settings</span>
              <h3 style={{ margin: 0, fontSize: "1.35rem", color: "#ffffff", fontWeight: 800 }}>
                Hosting & Domains: {projectName}
              </h3>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#f87171",
                  padding: "0.85rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  padding: "0.85rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Check size={16} /> Saved configuration successfully!
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Hosting Choice */}
              {subscriptionHostingType === "THEIRS" || subscriptionHostingType === "BOTH" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                    HOSTING SERVER
                  </label>
                  <select
                    className="premium-input"
                    value={selfHosted ? "THEIRS" : "OURS"}
                    onChange={(e) => setSelfHosted(e.target.value === "THEIRS")}
                    style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                    disabled={loading}
                  >
                    {subscriptionHostingType !== "THEIRS" && (
                      <option value="OURS">Host on our server (SaaS Subdomain)</option>
                    )}
                    <option value="THEIRS">Host on your own server (Self-Hosting)</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                    HOSTING SERVER
                  </span>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1.1rem", borderRadius: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#d1d5db" }}>
                    <Server size={15} color="#818cf8" /> Hosted on Webbing Premium Server (SaaS Subdomain)
                  </div>
                </div>
              )}

              {/* Subdomain Details */}
              {!selfHosted && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                    DEFAULT SUBDOMAIN URL
                  </span>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "0.85rem 1.1rem", borderRadius: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <code style={{ fontSize: "0.9rem", color: "#818cf8" }}>{subdomainUrl}</code>
                    <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "#c084fc", fontWeight: 600 }}>Visit ↗</a>
                  </div>
                </div>
              )}

              {/* Custom Domain Details */}
              {!selfHosted && subscriptionDomainType === "CUSTOM" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                    CUSTOM DOMAIN NAME
                  </label>
                  <input
                    type="text"
                    className="premium-input"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. acmestudio.com"
                    disabled={loading}
                    style={{ width: "100%" }}
                  />
                  {customDomain.trim() && (
                    <div style={{ marginTop: "0.5rem", background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.15)", padding: "1rem", borderRadius: "0.75rem", fontSize: "0.8rem", color: "#b8c3d4", lineHeight: 1.5 }}>
                      <strong>DNS Configuration Instructions:</strong>
                      <p style={{ margin: "0.4rem 0 0 0" }}>
                        Point a <strong>CNAME</strong> record for your domain (or subdomain like `www`) to:
                        <br />
                        <code style={{ color: "#a78bfa", display: "inline-block", marginTop: "0.2rem", background: "rgba(0, 0, 0, 0.2)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem" }}>cname.webbing.in</code>
                      </p>
                      {currentCustomDomain && currentCustomDomain === customDomain.trim().toLowerCase() && (
                        <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                          <button
                            type="button"
                            onClick={handleVerifyDomain}
                            className="glow-btn"
                            style={{
                              background: "linear-gradient(to right, #818cf8, #4f46e5)",
                              color: "#ffffff",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            disabled={verifying}
                          >
                            {verifying ? "Checking DNS..." : "Verify DNS Connection"}
                          </button>
                          {verificationStatus && (
                            <span style={{ fontSize: "0.8rem", color: verificationStatus.includes("Success") || verificationStatus.includes("connected") ? "#34d399" : "#f87171" }}>
                              {verificationStatus}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Self-Hosting Info & Zip Download */}
              {selfHosted && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "1.25rem", borderRadius: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    Self-Hosting Enabled
                  </span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.5 }}>
                    You have chosen to host this site on your own server. You can export the generated pages bundle and host it on Vercel, Netlify, cPanel, or any other hosting provider of your choice.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/api/projects/${projectId}/export`;
                    }}
                    className="glow-btn"
                    style={{
                      background: "linear-gradient(to right, #10b981, #059669)",
                      color: "#ffffff",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      alignSelf: "flex-start",
                      marginTop: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    Export Website Code (ZIP)
                  </button>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f3f4f6",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{
                    background: "linear-gradient(to right, #6366f1, #d946ef)",
                    color: "#ffffff",
                    padding: "0.75rem 2rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 15px rgba(217, 70, 239, 0.25)",
                  }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
