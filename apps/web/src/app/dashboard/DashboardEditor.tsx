"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, Check, Server, RefreshCw, Sparkles, Globe, Edit2, Play, Download, Layout } from "lucide-react";
import GeneratorForm from "../GeneratorForm";

interface Section {
  id: string;
  type: string;
  content: any;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sections: Section[];
}

interface Project {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  createdAt: string;
  selfHosted: boolean;
  customDomain: {
    hostname: string;
    verified: boolean;
    dnsToken: string;
    sslStatus: string;
  } | null;
  pages: Page[];
}

interface DashboardEditorProps {
  user: { userId: string; email: string; role: string; tenantId: string };
  tenant: {
    id: string;
    name: string;
    subscription: {
      creditsLimit: number;
      creditsUsed: number;
      domainType: string;
      hostingType: string;
    } | null;
    projects: Project[];
  };
  baseDomain: string;
  protocol: string;
}

export default function DashboardEditor({ user, tenant, baseDomain, protocol }: DashboardEditorProps) {
  const [projects, setProjects] = useState<Project[]>(tenant.projects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    tenant.projects.length > 0 ? tenant.projects[0].id : ""
  );

  const [activeTab, setActiveTab] = useState<"ai" | "manual" | "hosting">("ai");
  const [isCreatingNew, setIsCreatingNew] = useState(tenant.projects.length === 0);

  // Selected Project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Iframe Refresh Key
  const [iframeKey, setIframeKey] = useState(0);

  // --- States for Tabs ---
  // AI Edit Tab
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyle, setAiStyle] = useState("Modern Editorial");
  const [aiColors, setAiColors] = useState("#07111b");
  const [aiEcommerce, setAiEcommerce] = useState(false);

  // Manual Edit Tab
  const [manualName, setManualName] = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("");
  const [heroCtaUrl, setHeroCtaUrl] = useState("");
  const [aboutHeading, setAboutHeading] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Hosting Settings Tab
  const [hostingSelfHosted, setHostingSelfHosted] = useState(false);
  const [customDomainName, setCustomDomainName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");

  // Common Action States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sync state with selected project
  useEffect(() => {
    if (currentProject) {
      // Pre-populate prompt configuration
      setAiPrompt(currentProject.pages[0]?.description || "");
      
      // Pre-populate manual form inputs
      setManualName(currentProject.name);
      
      const page = currentProject.pages.find((p) => p.slug === "index") || currentProject.pages[0];
      if (page) {
        const hero = page.sections.find((s) => s.type === "HERO")?.content || {};
        setHeroHeading(hero.heading || "");
        setHeroSubheading(hero.subheading || "");
        setHeroCtaText(hero.ctaText || "");
        setHeroCtaUrl(hero.ctaUrl || "");

        const about = page.sections.find((s) => s.type === "ABOUT")?.content || {};
        setAboutHeading(about.heading || "");
        setAboutBody(about.body || "");

        const contact = page.sections.find((s) => s.type === "CONTACT")?.content || {};
        setContactEmail(contact.email || "");
      }

      // Pre-populate hosting setup
      setHostingSelfHosted(currentProject.selfHosted);
      setCustomDomainName(currentProject.customDomain?.hostname || "");
      setVerificationStatus("");
      setError("");
      setSuccess("");
    }
  }, [selectedProjectId, projects]);

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  // 1. Submit AI Regeneration
  const handleAiRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          style: aiStyle,
          colors: aiColors,
          ecommerce: aiEcommerce,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger regeneration.");

      setSuccess("Website generation enqueued! Page will reload when active.");
      
      // Poll project status periodically
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const checkRes = await fetch(`/api/projects/${currentProject.id}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // returns updated project payload
        });
        const checkData = await checkRes.json();
        
        if (checkData?.project?.status === "PUBLISHED" || attempts > 25) {
          clearInterval(interval);
          setLoading(false);
          setSuccess("Regeneration Complete!");
          
          // Reload page state
          window.location.reload();
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || "Regeneration failed.");
      setLoading(false);
    }
  };

  // 2. Submit Manual Content Updates
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          hero: {
            heading: heroHeading,
            subheading: heroSubheading,
            ctaText: heroCtaText,
            ctaUrl: heroCtaUrl,
          },
          about: {
            heading: aboutHeading,
            body: aboutBody,
          },
          contactEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save manually edited text.");

      setSuccess("Site content updated successfully!");
      handleRefreshPreview();
      
      // Update local state details
      setProjects((prev) =>
        prev.map((p) =>
          p.id === currentProject.id
            ? { ...p, name: manualName }
            : p
        )
      );

      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err.message || "Manual edit failed.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Domains & Hosting
  const handleHostingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: (tenant.subscription?.domainType || "SUBDOMAIN") === "CUSTOM" ? customDomainName : undefined,
          selfHosted: (tenant.subscription?.hostingType || "OURS") !== "OURS" ? hostingSelfHosted : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save hosting parameters.");

      setSuccess("Hosting configuration saved!");
      setTimeout(() => {
        setSuccess("");
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Hosting update failed.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Custom Domain DNS
  const handleVerifyDns = async () => {
    if (!currentProject) return;
    setVerifying(true);
    setVerificationStatus("");
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/verify-domain`, {
        method: "POST",
      });
      const data = await res.json();
      setVerificationStatus(data.message || (data.success ? "DNS Verified!" : "Check Failed."));
      if (data.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setVerificationStatus(err.message || "Verification inquiry failed.");
    } finally {
      setVerifying(false);
    }
  };

  // ZIP Code Exporter URL trigger
  const handleExportZip = () => {
    if (!currentProject) return;
    window.location.href = `/api/projects/${currentProject.id}/export`;
  };

  const subdomainUrl = currentProject
    ? `${protocol}://${currentProject.subdomain}.${baseDomain}`
    : "";

  const customDomainUrl = currentProject?.customDomain?.verified
    ? `${protocol}://${currentProject.customDomain.hostname}`
    : null;

  const activeSiteUrl = customDomainUrl || subdomainUrl;

  const totalCredits = tenant.subscription?.creditsLimit || 10;
  const usedCredits = tenant.subscription?.creditsUsed || 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)" }}>
      {/* Upper Workspace Control Header */}
      <div style={{ background: "rgba(13, 17, 28, 0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div>
            <span className="eyebrow">Active Workspace</span>
            <h1 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 800, color: "#fff" }}>{tenant.name}</h1>
          </div>

          {projects.length > 0 && !isCreatingNew && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Project:</span>
              <select
                className="premium-input"
                style={{ padding: "0.3rem 2rem 0.3rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.85rem", width: "auto" }}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.subdomain})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Credit Indicators */}
          <div style={{ display: "flex", gap: "1rem", background: "rgba(255, 255, 255, 0.02)", padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              AI Credits: <strong style={{ color: "#a78bfa" }}>{remainingCredits} left</strong>
            </span>
          </div>

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="glow-btn"
            style={{
              background: isCreatingNew
                ? "rgba(255, 255, 255, 0.05)"
                : "linear-gradient(to right, #6366f1, #d946ef)",
              color: "#fff",
              padding: "0.45rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isCreatingNew ? "Back to Editor" : "Create New Site"}
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workspace Container */}
      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden", background: "#070b13" }}>
        
        {/* LEFT SIDE PANEL: CONFIGURATOR & EDITOR */}
        <div style={{ width: "480px", minWidth: "480px", borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", display: "flex", flexDirection: "column", background: "rgba(10, 14, 23, 0.5)", backdropFilter: "blur(20px)" }}>
          {isCreatingNew ? (
            <div style={{ padding: "2rem" }}>
              <GeneratorForm user={user} />
            </div>
          ) : !currentProject ? (
            <div style={{ padding: "2rem", color: "#9ca3af", textAlign: "center" }}>
              No websites created yet. Click "Create New Site" to build one!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              
              {/* Tab Selector Buttons */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                <button
                  onClick={() => setActiveTab("ai")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "ai" ? "2px solid #818cf8" : "none",
                    color: activeTab === "ai" ? "#fff" : "#9ca3af",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Sparkles size={14} /> AI Edit
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "manual" ? "2px solid #818cf8" : "none",
                    color: activeTab === "manual" ? "#fff" : "#9ca3af",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Edit2 size={14} /> Manual Edit
                </button>
                <button
                  onClick={() => setActiveTab("hosting")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "hosting" ? "2px solid #818cf8" : "none",
                    color: activeTab === "hosting" ? "#fff" : "#9ca3af",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Globe size={14} /> Hosting & Domain
                </button>
              </div>

              {/* Status Banner */}
              {error && <div style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "0.8rem 1.5rem", fontSize: "0.85rem" }}>{error}</div>}
              {success && <div style={{ background: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.8rem 1.5rem", fontSize: "0.85rem" }}>{success}</div>}

              {/* Dynamic Content Pane based on Tab selection */}
              <div style={{ padding: "2rem", flexGrow: 1, overflowY: "auto" }}>
                
                {/* TAB: AI EDIT */}
                {activeTab === "ai" && (
                  <form onSubmit={handleAiRegenerate} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Regenerate via Prompt</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0 }}>
                        Describe changes or refinements you want made to the layout, copy, or styling. A new build will be generated.
                      </p>
                    </div>

                    <div className="field-group">
                      <label>AI Prompt Description</label>
                      <textarea
                        className="field"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. Rebuild this with a cleaner product design, focus on dark blue highlights, add three premium pricing packages, and set contact email to contact@acme.com."
                        rows={6}
                        disabled={loading}
                      />
                    </div>

                    <div className="field-group">
                      <label>Design Direction</label>
                      <select className="field" value={aiStyle} onChange={(e) => setAiStyle(e.target.value)} disabled={loading}>
                        <option value="Modern Editorial">Modern Editorial</option>
                        <option value="Clean Light Minimalist">Clean Light Minimalist</option>
                        <option value="Bold Product Launch">Bold Product Launch</option>
                        <option value="Warm Local Business">Warm Local Business</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="glow-btn"
                      style={{
                        background: "linear-gradient(to right, #6366f1, #d946ef)",
                        color: "#fff",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        boxShadow: "0 4px 15px rgba(217, 70, 239, 0.2)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                      disabled={loading}
                    >
                      <Play size={14} />
                      {loading ? "Rebuilding Layout..." : "Regenerate Website Layout"}
                    </button>
                  </form>
                )}

                {/* TAB: MANUAL EDITOR */}
                {activeTab === "manual" && (
                  <form onSubmit={handleManualSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Manual Content Overwrites</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0 }}>
                        Instantly customize text headings, copywriting, and email addresses. These updates apply immediately and do not cost AI credits.
                      </p>
                    </div>

                    <div className="field-group">
                      <label>Website Name</label>
                      <input className="field" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Acme Studio" disabled={loading} />
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.5rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>HERO SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>Hero Heading</label>
                      <input className="field" value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} placeholder="Main Title" disabled={loading} />
                    </div>

                    <div className="field-group">
                      <label>Hero Subheading</label>
                      <textarea className="field" value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} placeholder="Subheading description paragraphs" rows={3} disabled={loading} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="field-group">
                        <label>CTA Button Text</label>
                        <input className="field" value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="Contact Us" disabled={loading} />
                      </div>
                      <div className="field-group">
                        <label>CTA Button Link</label>
                        <input className="field" value={heroCtaUrl} onChange={(e) => setHeroCtaUrl(e.target.value)} placeholder="#contact" disabled={loading} />
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.5rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>ABOUT SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>About Us Heading</label>
                      <input className="field" value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)} placeholder="Our Story" disabled={loading} />
                    </div>

                    <div className="field-group">
                      <label>About Us Body</label>
                      <textarea className="field" value={aboutBody} onChange={(e) => setAboutBody(e.target.value)} placeholder="Describe your business mission, history, and staff details." rows={4} disabled={loading} />
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.5rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>CONTACT SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>Contact Email Address</label>
                      <input className="field" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@company.com" disabled={loading} />
                    </div>

                    <button
                      type="submit"
                      className="glow-btn"
                      style={{
                        background: "linear-gradient(to right, #10b981, #059669)",
                        color: "#fff",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: "0.5rem",
                      }}
                      disabled={loading}
                    >
                      {loading ? "Saving Overwrites..." : "Apply Text Changes"}
                    </button>
                  </form>
                )}

                {/* TAB: HOSTING & CUSTOM DOMAINS */}
                {activeTab === "hosting" && (
                  <form onSubmit={handleHostingSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Hosting & Domain Mapping</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0 }}>
                        Configure custom domains, verify your DNS records, or download a static ZIP archive.
                      </p>
                    </div>

                    {/* Server Hosting Options */}
                    {(tenant.subscription?.hostingType === "THEIRS" || tenant.subscription?.hostingType === "BOTH") ? (
                      <div className="field-group">
                        <label>Hosting Infrastructure</label>
                        <select
                          className="premium-input"
                          value={hostingSelfHosted ? "THEIRS" : "OURS"}
                          onChange={(e) => setHostingSelfHosted(e.target.value === "THEIRS")}
                          disabled={loading}
                        >
                          {tenant.subscription?.hostingType !== "THEIRS" && (
                            <option value="OURS">Host on Webbing SaaS Server</option>
                          )}
                          <option value="THEIRS">Host on your own server (Self-Hosting)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="field-group">
                        <label>Hosting Server</label>
                        <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                          <Server size={14} color="#818cf8" /> Webbing Cloud Hosting (SaaS Subdomain)
                        </div>
                      </div>
                    )}

                    {/* Default Subdomain Display */}
                    {!hostingSelfHosted && (
                      <div className="field-group">
                        <label>SaaS Subdomain URL</label>
                        <div style={{ background: "rgba(255, 255, 255, 0.01)", padding: "0.8rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <code style={{ fontSize: "0.85rem", color: "#818cf8" }}>{subdomainUrl}</code>
                          <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "#c084fc", fontWeight: 600 }}>Visit ↗</a>
                        </div>
                      </div>
                    )}

                    {/* Custom Domain Input & Verification */}
                    {!hostingSelfHosted && (tenant.subscription?.domainType || "SUBDOMAIN") === "CUSTOM" && (
                      <div className="field-group">
                        <label>Custom Domain Name</label>
                        <input
                          className="field"
                          value={customDomainName}
                          onChange={(e) => setCustomDomainName(e.target.value)}
                          placeholder="e.g. yourbrand.com"
                          disabled={loading}
                        />

                        {customDomainName.trim() && (
                          <div style={{ marginTop: "0.75rem", background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.15)", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.8rem", color: "#b8c3d4", lineHeight: 1.5 }}>
                            <strong>DNS Configuration:</strong>
                            <p style={{ margin: "0.25rem 0" }}>
                              Create a <strong>CNAME</strong> record pointing to:
                            </p>
                            <code style={{ color: "#a78bfa", display: "inline-block", background: "rgba(0,0,0,0.2)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", margin: "0.25rem 0" }}>cname.webbing.in</code>
                            
                            {/* Verification trigger */}
                            {currentProject.customDomain?.hostname === customDomainName.trim().toLowerCase() && (
                              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <button
                                  type="button"
                                  onClick={handleVerifyDns}
                                  className="glow-btn"
                                  style={{
                                    background: "linear-gradient(to right, #818cf8, #4f46e5)",
                                    color: "#ffffff",
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "0.4rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                  disabled={verifying}
                                >
                                  {verifying ? "Checking DNS..." : "Verify DNS Link"}
                                </button>
                                {verificationStatus && (
                                  <span style={{ fontSize: "0.75rem", color: verificationStatus.includes("Success") || verificationStatus.includes("connected") ? "#34d399" : "#f87171" }}>
                                    {verificationStatus}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Self Hosting / Download Code Exporter */}
                    {hostingSelfHosted && (
                      <div style={{ background: "rgba(16, 185, 129, 0.02)", border: "1px solid rgba(16, 185, 129, 0.15)", padding: "1.25rem", borderRadius: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Download size={14} /> Static Code Bundle Exporter
                        </span>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.5 }}>
                          Download a ZIP archive containing your self-hosted pages (index.html) and theme configurations (style.css). Extract it to any host (e.g. Netlify, Vercel, cPanel).
                        </p>
                        <button
                          type="button"
                          onClick={handleExportZip}
                          className="glow-btn"
                          style={{
                            background: "linear-gradient(to right, #10b981, #059669)",
                            color: "#fff",
                            padding: "0.5rem 1rem",
                            borderRadius: "0.4rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            alignSelf: "flex-start",
                            cursor: "pointer",
                          }}
                        >
                          Export Website ZIP
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="glow-btn"
                      style={{
                        background: "linear-gradient(to right, #6366f1, #d946ef)",
                        color: "#fff",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        marginTop: "0.5rem",
                      }}
                      disabled={loading}
                    >
                      {loading ? "Saving Settings..." : "Save Hosting Configuration"}
                    </button>
                  </form>
                )}

              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE PANEL: LIVE INTERACTIVE PREVIEW */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", background: "#090d16", position: "relative" }}>
          
          {/* Iframe Control Bar */}
          <div style={{ padding: "0.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b0f19" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>
              <Layout size={14} />
              <span>Live Interactive Layout</span>
              {currentProject && (
                <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", color: "#818cf8" }}>
                  {currentProject.status === "PUBLISHED" ? "Render Active" : "Building..."}
                </span>
              )}
            </div>

            {currentProject && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  Active Address: <a href={activeSiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#c084fc", textDecoration: "none" }}>{currentProject.subdomain}.{baseDomain} ↗</a>
                </span>
                
                <button
                  onClick={handleRefreshPreview}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderRadius: "0.25rem",
                    padding: "0.3rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Refresh Preview"
                >
                  <RefreshCw size={12} className={currentProject.status === "GENERATING" ? "animate-spin" : ""} />
                </button>
              </div>
            )}
          </div>

          {/* Website Rendering Iframe */}
          <div style={{ flexGrow: 1, padding: "1rem", display: "flex", justifyContent: "center", alignItems: "stretch", overflow: "hidden" }}>
            {currentProject ? (
              currentProject.status === "GENERATING" || currentProject.status === "DRAFT" ? (
                <div style={{ flexGrow: 1, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
                  <RefreshCw size={32} className="animate-spin" color="#818cf8" />
                  <strong style={{ fontSize: "1.1rem", color: "#fff" }}>Your website is being generated...</strong>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
                    AI is writing components, compiling copy, and updating layouts.
                  </p>
                </div>
              ) : (
                <iframe
                  key={iframeKey}
                  src={`/preview/${currentProject.id}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.75rem",
                    background: "#07111b",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                />
              )
            ) : (
              <div style={{ flexGrow: 1, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#9ca3af" }}>
                <span>Use the configuration panel on the left to generate your first website layout.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
