"use client";

import React, { useState } from "react";
import { Edit2, Check, Plus, Trash2 } from "lucide-react";

interface AdminProjectEditorProps {
  project: {
    id: string;
    name: string;
    subdomain: string;
    theme: any;
  };
  baseDomain: string;
}

export default function AdminProjectEditor({
  project,
  baseDomain,
}: AdminProjectEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [subdomain, setSubdomain] = useState(project.subdomain);
  
  // Extract metadata fields from project theme JSON
  const themeMetadata = project.theme?.metadata || {};
  const [logoUrl, setLogoUrl] = useState(themeMetadata.logoUrl || "");
  const [clientLogins, setClientLogins] = useState<Array<{ email: string; password: string }>>(
    themeMetadata.clientLogins || []
  );

  // Client add form local states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // If there is an unsaved client email/password entered, automatically add it first
    let finalLogins = [...clientLogins];
    if (newEmail.trim() && newPassword.trim()) {
      if (!finalLogins.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
        finalLogins.push({ email: newEmail.trim(), password: newPassword.trim() });
      }
    }

    try {
      const res = await fetch(`/api/projects/${project.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subdomain: subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
          theme: {
            ...project.theme,
            metadata: {
              ...themeMetadata,
              clientLogins: finalLogins,
              logoUrl: logoUrl.trim()
            }
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save website changes.");

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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="glow-btn"
        style={{
          background: "rgba(168, 85, 247, 0.15)",
          border: "1px solid rgba(168, 85, 247, 0.3)",
          color: "#c084fc",
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
        <Edit2 size={13} />
        Edit Settings
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
              maxWidth: "550px",
              padding: "2rem",
              borderRadius: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              position: "relative",
              textAlign: "left",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="eyebrow">Admin Console</span>
              <h3 style={{ margin: 0, fontSize: "1.35rem", color: "#ffffff", fontWeight: 800 }}>
                Edit Website & Logins
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>
                Update website name, subdomain url, logo branding, and client logins.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#f87171",
                  padding: "0.85rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1.25rem",
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
                  marginBottom: "1.25rem",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Check size={16} /> Saved website branding successfully!
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              
              {/* Website Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  WEBSITE BRAND NAME
                </label>
                <input
                  type="text"
                  className="premium-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Premium Shop"
                  required
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: "0.5rem",
                    padding: "0.6rem 0.8rem",
                    color: "#fff",
                    fontSize: "0.85rem"
                  }}
                />
              </div>

              {/* Subdomain */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  SUBDOMAIN PREFIX
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <input
                    type="text"
                    className="premium-input"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="subdomain"
                    required
                    disabled={loading}
                    style={{ 
                      flexGrow: 1, 
                      background: "rgba(255,255,255,0.05)", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      color: "#fff",
                      fontSize: "0.85rem"
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>.{baseDomain}</span>
                </div>
              </div>

              {/* Logo Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  LOGO BRANDING URL / BASE64
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end" }}>
                  <input
                    type="text"
                    className="premium-input"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={loading}
                    style={{ 
                      flexGrow: 1, 
                      background: "rgba(255,255,255,0.05)", 
                      border: "1px solid rgba(255,255,255,0.1)", 
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.8rem",
                      color: "#fff",
                      fontSize: "0.85rem"
                    }}
                  />
                  <div style={{ position: "relative" }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ 
                        opacity: 0, 
                        position: "absolute", 
                        top: 0, 
                        left: 0, 
                        width: "100%", 
                        height: "100%", 
                        cursor: "pointer" 
                      }}
                    />
                    <button 
                      type="button" 
                      style={{ 
                        background: "rgba(255,255,255,0.08)", 
                        border: "1px solid rgba(255,255,255,0.15)", 
                        color: "#fff", 
                        padding: "0.6rem 1rem", 
                        borderRadius: "0.5rem", 
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        pointerEvents: "none"
                      }}
                    >
                      Upload Logo
                    </button>
                  </div>
                </div>
                {logoUrl && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.02)", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.05)", marginTop: "0.25rem" }}>
                    <img src={logoUrl} alt="Logo" style={{ height: "24px", width: "auto", objectFit: "contain", borderRadius: "0.2rem" }} />
                    <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>Logo preview branding active</span>
                  </div>
                )}
              </div>

              {/* Client Logins */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  CLIENT LOGINS MANAGEMENTS
                </label>
                
                {/* Form to add new login */}
                <div style={{ background: "rgba(0,0,0,0.15)", padding: "0.85rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>Add New Access ID</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Client Email</span>
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        placeholder="client@example.com" 
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.3rem", padding: "0.4rem 0.6rem", fontSize: "0.8rem", color: "#fff" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Client Password</span>
                      <input 
                        type="text" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="Password" 
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.3rem", padding: "0.4rem 0.6rem", fontSize: "0.8rem", color: "#fff" }}
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!newEmail.trim() || !newPassword.trim()) {
                        alert("Both email and password are required.");
                        return;
                      }
                      if (clientLogins.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
                        alert("This email is already added.");
                        return;
                      }
                      setClientLogins([...clientLogins, { email: newEmail.trim(), password: newPassword.trim() }]);
                      setNewEmail("");
                      setNewPassword("");
                    }}
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderRadius: "0.25rem", width: "fit-content", alignSelf: "flex-end", cursor: "pointer", fontWeight: 700 }}
                  >
                    + Add Login ID
                  </button>
                </div>

                {/* List of active logins */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>Active Client Accounts:</span>
                  {clientLogins.length === 0 ? (
                    <span style={{ fontSize: "0.75rem", color: "#4b5563", fontStyle: "italic" }}>No client logins configured.</span>
                  ) : (
                    clientLogins.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.75rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.3rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ fontSize: "0.75rem" }}>
                          <strong style={{ color: "#fff" }}>{item.email}</strong>
                          <span style={{ color: "#6b7280", marginLeft: "1rem" }}>Pass: {item.password}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setClientLogins(clientLogins.filter((_, i) => i !== idx))}
                          style={{ background: "transparent", border: 0, color: "#f87171", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#f3f4f6",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
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
                    background: "linear-gradient(to right, #6366f1, #a855f7)",
                    color: "#ffffff",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: 0
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
