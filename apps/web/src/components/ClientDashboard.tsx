"use client";

import React, { useState, useEffect } from "react";
import { Mail, Check, LogOut, Settings, MessageSquare, Sparkles, Lock, ArrowRight, User } from "lucide-react";

interface ClientDashboardProps {
  projectId: string;
  projectSubdomain: string;
  baseDomain: string;
}

export default function ClientDashboard({ projectId, projectSubdomain, baseDomain }: ClientDashboardProps) {
  // Authentication states
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<"leads" | "branding">("leads");
  const [websiteName, setWebsiteName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState("");

  // Load session from local storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem(`client_email_${projectId}`);
      const savedPassword = localStorage.getItem(`client_password_${projectId}`);

      if (savedEmail && savedPassword) {
        handleLoadDashboard(savedEmail, savedPassword);
      }
    }
  }, [projectId]);

  const handleLoadDashboard = async (authEmail: string, authPass: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/client-dashboard`, {
        method: "GET",
        headers: {
          "x-client-email": authEmail,
          "x-client-password": authPass
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      setWebsiteName(data.name || "");
      setLogoUrl(data.logoUrl || "");
      setSubmissions(data.submissions || []);
      setIsAuthed(true);

      // Save credentials to localStorage
      localStorage.setItem(`client_email_${projectId}`, authEmail);
      localStorage.setItem(`client_password_${projectId}`, authPass);
    } catch (err: any) {
      setAuthError(err.message || "Failed to load dashboard.");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required.");
      return;
    }
    handleLoadDashboard(email.trim(), password.trim());
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setEmail("");
    setPassword("");
    localStorage.removeItem(`client_email_${projectId}`);
    localStorage.removeItem(`client_password_${projectId}`);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess("");
    const authEmail = localStorage.getItem(`client_email_${projectId}`) || "";
    const authPass = localStorage.getItem(`client_password_${projectId}`) || "";

    try {
      const res = await fetch(`/api/projects/${projectId}/client-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-email": authEmail,
          "x-client-password": authPass
        },
        body: JSON.stringify({
          name: websiteName.trim(),
          logoUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save branding");

      setWebsiteName(data.name || "");
      setLogoUrl(data.logoUrl || "");
      setSaveSuccess("Branding details updated successfully!");
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Error updating branding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Outfit', 'Inter', sans-serif", minHeight: "100vh", background: "#060914", display: "flex", flexDirection: "column" }}>
      {/* LOGIN SCREEN */}
      {!isAuthed ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "420px", width: "100%" }}>
            <form 
              onSubmit={handleLoginSubmit} 
              style={{ 
                background: "rgba(10, 14, 23, 0.8)", 
                border: "1px solid rgba(255,255,255,0.06)", 
                backdropFilter: "blur(16px)",
                padding: "2.5rem", 
                borderRadius: "1.25rem", 
                display: "flex", 
                flexDirection: "column", 
                gap: "1.25rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "inline-flex", padding: "0.75rem", borderRadius: "50%", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", marginBottom: "1rem" }}>
                  <Lock size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>Client Admin Portal</h3>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Enter access details for {projectSubdomain}.{baseDomain}</p>
              </div>

              {authError && (
                <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", textAlign: "center" }}>
                  {authError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Account Email</label>
                <input 
                  type="email" 
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.9rem" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@brand.com"
                  disabled={loading}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Access Password</label>
                <input 
                  type="password" 
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.9rem" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                style={{ 
                  width: "100%", 
                  padding: "0.75rem", 
                  borderRadius: "0.5rem", 
                  background: "linear-gradient(to right, #6366f1, #a855f7)", 
                  color: "#fff", 
                  fontSize: "0.9rem", 
                  fontWeight: 700, 
                  border: 0, 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "0.5rem",
                  boxShadow: "0 10px 20px rgba(99, 102, 241, 0.25)",
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
              >
                {loading ? "Authenticating..." : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* DASHBOARD INTERFACE */
        <>
          {/* Header navigation bar */}
          <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)", background: "rgba(10, 14, 23, 0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: "30px", objectFit: "contain", borderRadius: "0.2rem" }} />
                ) : (
                  <div style={{ padding: "0.25rem 0.5rem", borderRadius: "0.4rem", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", fontSize: "0.85rem", fontWeight: 700 }}>
                    {websiteName?.[0]?.toUpperCase() || "W"}
                  </div>
                )}
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                  {websiteName || "Client Dashboard"}
                </span>
                <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", padding: "0.15rem 0.5rem", borderRadius: "2rem", fontWeight: 700 }}>Client Mode</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => setActiveTab("leads")} 
                    style={{ background: activeTab === "leads" ? "rgba(99,102,241,0.15)" : "transparent", border: 0, color: activeTab === "leads" ? "#818cf8" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.3rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Leads / Inbox
                  </button>
                  <button 
                    onClick={() => setActiveTab("branding")} 
                    style={{ background: activeTab === "branding" ? "rgba(99,102,241,0.15)" : "transparent", border: 0, color: activeTab === "branding" ? "#818cf8" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.3rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Customize Branding
                  </button>
                </div>
                <button 
                  onClick={handleLogout} 
                  style={{ border: 0, color: "#f87171", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </div>
          </header>

          {/* Main workspace container */}
          <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "2rem", width: "100%" }}>
            
            {/* VIEW 1: CONTACT SUBMISSIONS (LEADS) */}
            {activeTab === "leads" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>Form Submissions</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Review lead inquiries sent through the contact form of your live website.</p>
                </div>

                {submissions.length === 0 ? (
                  <div style={{ background: "rgba(10, 14, 23, 0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "4rem 2rem", textAlign: "center", color: "#cbd5e1" }}>
                    <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(255,255,255,0.02)", color: "#64748b", marginBottom: "1rem" }}>
                      <MessageSquare size={32} />
                    </div>
                    <h3 style={{ margin: 0, color: "#fff" }}>Inbox is Empty</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.25rem" }}>No contact form details have been submitted yet on your website.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {submissions.map((lead) => (
                      <div 
                        key={lead.id} 
                        style={{ 
                          background: "rgba(10, 14, 23, 0.4)", 
                          border: "1px solid rgba(255,255,255,0.06)", 
                          borderRadius: "0.75rem", 
                          padding: "1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <strong style={{ fontSize: "1rem", color: "#fff", display: "block" }}>{lead.name}</strong>
                            <a href={`mailto:${lead.email}`} style={{ color: "#818cf8", fontSize: "0.8rem", textDecoration: "none" }}>{lead.email}</a>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {new Date(lead.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.75rem", color: "#cbd5e1", fontSize: "0.85rem", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {lead.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: BRAND CUSTOMIZATION */}
            {activeTab === "branding" && (
              <div style={{ maxWidth: "600px" }}>
                <form 
                  onSubmit={handleSaveBranding} 
                  style={{ 
                    background: "rgba(10, 14, 23, 0.4)", 
                    border: "1px solid rgba(255,255,255,0.06)", 
                    borderRadius: "1rem", 
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem"
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>Website Branding</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0.25rem 0 0 0" }}>Update the site display name and upload a custom logo image file.</p>
                  </div>

                  {saveSuccess && (
                    <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                      <Check size={16} /> {saveSuccess}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Website Name</label>
                    <input 
                      type="text" 
                      required
                      style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.9rem" }}
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                      placeholder="e.g. My Custom Brand"
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Upload Website Logo</label>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                      {logoUrl && (
                        <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <img src={logoUrl} alt="Logo preview" style={{ maxHeight: "40px", objectFit: "contain" }} />
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        style={{ 
                          padding: "0.5rem", 
                          fontSize: "0.8rem", 
                          background: "rgba(255,255,255,0.02)", 
                          border: "1px solid rgba(255,255,255,0.08)", 
                          borderRadius: "0.5rem", 
                          color: "#9ca3af",
                          flexGrow: 1
                        }}
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
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    style={{ 
                      width: "fit-content", 
                      alignSelf: "flex-end", 
                      padding: "0.6rem 1.5rem", 
                      borderRadius: "0.5rem", 
                      background: "linear-gradient(to right, #6366f1, #a855f7)", 
                      color: "#fff", 
                      fontSize: "0.85rem", 
                      fontWeight: 700, 
                      border: 0, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)",
                      opacity: loading ? 0.7 : 1
                    }}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : (
                      <>
                        <Sparkles size={14} /> Save Branding Settings
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </main>
        </>
      )}
    </div>
  );
}
