"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, Check, Server, RefreshCw, Sparkles, Globe, Edit2, Play, Download, Layout, ArrowLeft, Plus, MessageSquare, Layers, Sliders, Image, LogOut, CheckCircle, AlertTriangle, ExternalLink, Shield, ArrowRight, Trash2, ChevronLeft, ChevronRight, PlusCircle, Home } from "lucide-react";
import GeneratorForm from "../GeneratorForm";
import LlmKeyManager, { LlmKeyView } from "../components/LlmKeyManager";

interface Section {
  id: string;
  type: string;
  order: number;
  content: any;
  styles: any;
}

interface Page {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  description: string | null;
  sections: Section[];
  seoMetadata?: any;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  subdomain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  selfHosted: boolean;
  theme: any;
  customDomain: {
    id: string;
    projectId: string;
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
      planId: string;
      creditsLimit: number;
      creditsUsed: number;
      domainType: string;
      hostingType: string;
    } | null;
    projects: Project[];
  };
  baseDomain: string;
  protocol: string;
  initialPlans?: any[];
  upiId?: string;
}

const GenerationProgress = ({ createdAt }: { createdAt: string }) => {
  const steps = [
    "Analyzing Prompt...",
    "Generating Content...",
    "Generating Images...",
    "Building Layout...",
    "Creating Preview..."
  ];
  
  const [stepIndex, setStepIndex] = useState(0);
  
  useEffect(() => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const currentStep = Math.min(Math.floor(elapsed / 3000), steps.length - 1);
    setStepIndex(currentStep);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", width: "320px" }}>
        {steps.map((stepText, idx) => {
          const isPending = idx > stepIndex;
          const isRunning = idx === stepIndex;
          const isDone = idx < stepIndex;

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", background: isRunning ? "rgba(99, 102, 241, 0.08)" : "transparent", border: isRunning ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent", borderRadius: "0.4rem" }}>
              {isDone && <span style={{ color: "#34d399", fontWeight: "bold" }}>✓</span>}
              {isRunning && <span className="animate-spin" style={{ color: "#818cf8", display: "inline-block" }}>◌</span>}
              {isPending && <span style={{ color: "#4b5563" }}>○</span>}
              <span style={{ fontSize: "0.85rem", color: isDone ? "#9ca3af" : isRunning ? "#fff" : "#4b5563", fontWeight: isRunning ? 700 : 400 }}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function DashboardEditor({ user, tenant, baseDomain, protocol, initialPlans = [], upiId = "pogakula@ybl" }: DashboardEditorProps) {
  const [projects, setProjects] = useState<Project[]>(tenant.projects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeView, setActiveView] = useState<"homepage" | "builder">("homepage");
  const [isCreatingNew, setIsCreatingNew] = useState(tenant.projects.length === 0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [splitLayout, setSplitLayout] = useState<"split" | "editor-focus" | "preview-focus" | "editor-only" | "preview-only">("split");

  // Upgrade Plan states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);
  const [utrCode, setUtrCode] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [upgradeError, setUpgradeError] = useState("");
  const [buyCreditsView, setBuyCreditsView] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  // Left Panel Sidebar Tabs
  const [builderTab, setBuilderTab] = useState<"chat" | "layers" | "properties" | "assets" | "settings">("chat");
  // Settings sub-tab
  const [settingsTab, setSettingsTab] = useState<"general" | "domains" | "seo" | "analytics" | "keys" | "devkeys">("general");

  // Selected Project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Iframe Refresh Key
  const [iframeKey, setIframeKey] = useState(0);

  // --- AI Chat states ---
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Welcome to the AI Assistant! Type below to edit headings, add sections, adjust styles, or transition themes in real time." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // --- Properties Overwrites states ---
  const [manualName, setManualName] = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("");
  const [heroCtaUrl, setHeroCtaUrl] = useState("");
  const [aboutHeading, setAboutHeading] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // --- Settings tab states ---
  const [customDomainName, setCustomDomainName] = useState("");
  const [projectSubdomain, setProjectSubdomain] = useState("");
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState("");
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsStatus, setDnsStatus] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [analyticsTag, setAnalyticsTag] = useState("");
  const [preferredProvider, setPreferredProvider] = useState("gemini");
  
  // Custom API keys management
  const [llmKeys, setLlmKeys] = useState<LlmKeyView[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);

  // Developer API keys management
  const [devKeys, setDevKeys] = useState<any[]>([]);
  const [devKeysLoading, setDevKeysLoading] = useState(false);

  const isAgencyOrAdmin = user.role === "ADMIN" || tenant.subscription?.planId === "agency" || tenant.subscription?.planId === "agency-plan";

  const handleGenerateDevKey = async () => {
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setDevKeys(prev => [data.key, ...prev]);
        setSuccess("Developer API key generated successfully!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.error || "Failed to generate key.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate developer key.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRevokeDevKey = async (id: string) => {
    try {
      const res = await fetch(`/api/developer/keys?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setDevKeys(prev => prev.filter(k => k.id !== id));
        setSuccess("Developer API key revoked.");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(data.error || "Failed to revoke key.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to revoke developer key.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // --- Publishing checks states ---
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishProgress, setPublishProgress] = useState<Array<{ name: string; status: "pending" | "running" | "success" | "error"; error?: string }>>([
    { name: "Verify Subdomain Configuration", status: "pending" },
    { name: "Active Routing Resolution", status: "pending" },
    { name: "SSL Certificate Validation", status: "pending" },
    { name: "Static Assets Integrity Check", status: "pending" }
  ]);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<"success" | "error" | null>(null);

  // Common Action States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load LLM Keys in settings
  useEffect(() => {
    if (activeView === "builder" && builderTab === "settings" && settingsTab === "keys") {
      setKeysLoading(true);
      fetch("/api/llm-keys")
        .then((res) => res.json())
        .then((data) => {
          setLlmKeys(data.keys || []);
          setKeysLoading(false);
        })
        .catch(() => setKeysLoading(false));
    }
    if (activeView === "builder" && builderTab === "settings" && settingsTab === "devkeys") {
      setDevKeysLoading(true);
      fetch("/api/developer/keys")
        .then((res) => res.json())
        .then((data) => {
          setDevKeys(data.keys || []);
          setDevKeysLoading(false);
        })
        .catch(() => setDevKeysLoading(false));
    }
  }, [activeView, builderTab, settingsTab]);

  // Sync state with selected project
  useEffect(() => {
    if (currentProject) {
      setManualName(currentProject.name);
      
      const page = currentProject.pages.find((p) => p.slug === "index") || currentProject.pages[0];
      if (page) {
        setSeoTitle((page.seoMetadata as any)?.title || page.title || "");
        setSeoDescription((page.seoMetadata as any)?.description || page.description || "");

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

      setCustomDomainName(currentProject.customDomain?.hostname || "");
      setProjectSubdomain(currentProject.subdomain || "");
      setDnsStatus("");
      setSubdomainStatus("");
      setError("");
      setSuccess("");
      setPreferredProvider(currentProject.theme?.preferredProvider || "gemini");
      setAnalyticsTag(currentProject.theme?.analyticsTag || "");
    }
  }, [selectedProjectId, projects]);

  // Poll for generating projects status updates
  useEffect(() => {
    if (!selectedProjectId) return;
    
    const p = projects.find(x => x.id === selectedProjectId);
    if (!p) return;
    
    if (p.status === "GENERATING" || p.status === "DRAFT") {
      const intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/${p.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.project) {
              const updated = data.project;
              setProjects((prev) =>
                prev.map((proj) => (proj.id === updated.id ? updated : proj))
              );
              
              if (updated.status !== "GENERATING" && updated.status !== "DRAFT") {
                clearInterval(intervalId);
                setIframeKey((prev) => prev + 1);
              }
            }
          }
        } catch (err) {
          console.error("Polling project status failed:", err);
        }
      }, 2500);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedProjectId, projects]);

  const handleNewProjectGenerated = async (newProjectId: string) => {
    try {
      const response = await fetch(`/api/projects/${newProjectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.project) {
          const newProject = data.project;
          setProjects((prev) => {
            const exists = prev.find(p => p.id === newProject.id);
            if (exists) return prev;
            return [newProject, ...prev];
          });
          setSelectedProjectId(newProjectId);
          setIsCreatingNew(false);
          setActiveView("builder");
        }
      }
    } catch (err) {
      console.error("Error loading newly generated project details:", err);
    }
  };

  const handleRetryGeneration = async (project: Project) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? { ...p, status: "GENERATING", theme: { ...p.theme, failureReason: null } }
            : p
        )
      );

      const res = await fetch(`/api/projects/${project.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: project.description || "Website layout for business",
          style: project.theme?.style || "Modern Startup",
          ecommerce: !!project.theme?.ecommerce,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger regeneration.");
      
      setSuccess("Website generation restarted successfully!");
    } catch (err: any) {
      console.error("Retry generation failed:", err);
      setError(err.message || "Failed to restart generation.");
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id
            ? { ...p, status: "FAILED", theme: { ...p.theme, failureReason: err.message } }
            : p
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPreview = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Submit AI Chat Edits
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !chatInput.trim()) return;

    const inputMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: inputMsg }]);
    setChatInput("");
    setChatLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputMsg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse edits.");

      setChatMessages((prev) => [...prev, { sender: "ai", text: "Applied changes successfully! Refreshing interactive preview." }]);
      handleRefreshPreview();
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { sender: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Save metadata settings into the project config
      const res = await fetch(`/api/projects/${currentProject.id}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: customDomainName.trim() || "",
          subdomain: projectSubdomain.trim() || "",
          theme: {
            ...currentProject.theme,
            preferredProvider,
            analyticsTag,
          },
          seo: {
            title: seoTitle,
            description: seoDescription,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project settings.");

      setSuccess("Settings applied successfully!");
      handleRefreshPreview();
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Manual Properties overrides
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
      if (!res.ok) throw new Error(data.error || "Failed to apply content changes.");

      setSuccess("Manual content applied!");
      handleRefreshPreview();
      setProjects((prev) =>
        prev.map((p) => (p.id === currentProject.id ? { ...p, name: manualName } : p))
      );
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      setError(err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  // Verify Custom Domain CNAME DNS
  const handleVerifyDns = async () => {
    if (!currentProject) return;
    setDnsVerifying(true);
    setDnsStatus("");
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/verify-domain`, {
        method: "POST",
      });
      const data = await res.json();
      setDnsStatus(data.message || (data.success ? "DNS Records Active!" : "Failed to verify CNAME. Please check registrar setup."));
      if (data.success) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id === currentProject.id) {
              return {
                ...p,
                customDomain: p.customDomain
                  ? { ...p.customDomain, verified: true, sslStatus: "ACTIVE" }
                  : {
                      id: "temp",
                      projectId: p.id,
                      hostname: customDomainName,
                      verified: true,
                      dnsToken: "",
                      sslStatus: "ACTIVE",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      setDnsStatus(err.message || "DNS inquiry query failed.");
    } finally {
      setDnsVerifying(false);
    }
  };

  // Trigger publishing sequence check
  const handlePublish = async () => {
    if (!currentProject) return;
    setPublishModalOpen(true);
    setPublishing(true);
    setPublishResult(null);

    // Initial pendings
    setPublishProgress([
      { name: "Verify Subdomain Configuration", status: "running" },
      { name: "Active Routing Resolution", status: "pending" },
      { name: "SSL Certificate Validation", status: "pending" },
      { name: "Static Assets Integrity Check", status: "pending" }
    ]);

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/publish`, {
        method: "POST"
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Run sequential visual animations of success
        setTimeout(() => {
          setPublishProgress(prev => [
            { ...prev[0], status: "success" },
            { ...prev[1], status: "running" },
            ...prev.slice(2)
          ]);
        }, 800);

        setTimeout(() => {
          setPublishProgress(prev => [
            prev[0],
            { ...prev[1], status: "success" },
            { ...prev[2], status: "running" },
            prev[3]
          ]);
        }, 1600);

        setTimeout(() => {
          setPublishProgress(prev => [
            prev[0],
            prev[1],
            { ...prev[2], status: "success" },
            { ...prev[3], status: "running" }
          ]);
        }, 2400);

        setTimeout(() => {
          setPublishProgress(prev => [
            prev[0],
            prev[1],
            prev[2],
            { ...prev[3], status: "success" }
          ]);
          setPublishing(false);
          setPublishResult("success");
          
          // Update status locally
          setProjects(prev =>
            prev.map(p => p.id === currentProject.id ? { ...p, status: "PUBLISHED" } : p)
          );
        }, 3200);
      } else {
        // Set error state on the current check step
        const failedReason = data.error || "Automatic deployment check failed.";
        setPublishProgress(prev => [
          { ...prev[0], status: "error", error: failedReason },
          ...prev.slice(1)
        ]);
        setPublishing(false);
        setPublishResult("error");
      }
    } catch (err: any) {
      setPublishProgress(prev => [
        { ...prev[0], status: "error", error: err.message },
        ...prev.slice(1)
      ]);
      setPublishing(false);
      setPublishResult("error");
    }
  };

  // ZIP Code Exporter URL trigger
  const handleExportZip = (format: "html" | "react" | "nextjs") => {
    if (!currentProject) return;
    window.location.href = `/api/projects/${currentProject.id}/export?format=${format}`;
  };

  // Delete project trigger
  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this website project? This action is permanent and cannot be undone.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project.");
      
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId("");
        setActiveView("homepage");
      }
    } catch (err: any) {
      alert(err.message || "Delete failed.");
    }
  };

  // Submit payment request for upgrade
  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;
    setSubmittingRequest(true);
    setUpgradeMessage("");
    setUpgradeError("");
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedUpgradePlan.id || selectedUpgradePlan.name.toLowerCase().replace(/\s+/g, "-"),
          amount: selectedUpgradePlan.price,
          utr: utrCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");
      setUpgradeMessage("Request submitted! Our team will verify and activate your plan.");
      setUtrCode("");
      setTimeout(() => {
        setUpgradeModalOpen(false);
        setSelectedUpgradePlan(null);
        setUpgradeMessage("");
      }, 3000);
    } catch (err: any) {
      setUpgradeError(err.message || "Upgrade request failed.");
    } finally {
      setSubmittingRequest(false);
    }
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

  const currentPlan = tenant.subscription?.planId || "starter";
  const isAgency = currentPlan === "agency";
  const canBuyCredits = currentPlan === "pro-plan" || currentPlan === "agency";

  // Homepage categories
  const draftProjects = projects.filter(p => p.status === "DRAFT" || p.status === "GENERATING" || p.status === "FAILED");
  const publishedProjects = projects.filter(p => p.status === "PUBLISHED");

  // ----------------------------------------------------
  // HOMEPAGE VIEW RENDER
  // ----------------------------------------------------
  if (activeView === "homepage") {
    return (
      <div style={{ display: "flex", width: "100%", height: "calc(100vh - 70px)", background: "#070b13", overflow: "hidden" }}>
        {/* PERSISTENT LEFT SIDEBAR */}
        <div style={{
          width: sidebarCollapsed ? "64px" : "200px",
          minWidth: sidebarCollapsed ? "64px" : "200px",
          background: "rgba(10, 14, 23, 0.95)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 0.5rem 0.5rem 0.5rem",
          transition: "width 0.2s, min-width 0.2s",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={() => {
                setActiveView("homepage");
                setIsCreatingNew(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.375rem",
                background: "rgba(129, 140, 248, 0.08)",
                border: "none",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <Home size={16} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => {
                setIsCreatingNew(true);
                setActiveView("builder");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.375rem",
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <PlusCircle size={16} />
              {!sidebarCollapsed && <span>Create New</span>}
            </button>

            {user.role === "ADMIN" && (
              <a
                href="/admin"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  color: "#9ca3af",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
              >
                <Shield size={16} />
                {!sidebarCollapsed && <span>Admin Console</span>}
              </a>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "all 0.2s"
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        <div style={{ flexGrow: 1, padding: "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
        <main style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* Header row */}
          <div className="dashboard-header-row">
            <div>
              <span className="eyebrow" style={{ color: "#818cf8" }}>Dashboard</span>
              <h1 style={{ fontSize: "clamp(1.3rem, 4.5vw, 2.25rem)", fontWeight: 850, margin: "0.25rem 0", color: "#fff", wordBreak: "break-word" }}>Welcome back, {user.email}</h1>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Create, customize, publish and export your dynamic web sites.</p>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                <span style={{ color: "#9ca3af" }}>Credits: <strong style={{ color: "#818cf8" }}>{remainingCredits} left</strong></span>
                <button
                  onClick={() => {
                    setUpgradeModalOpen(true);
                    setBuyCreditsView(isAgency);
                  }}
                  style={{ background: isAgency ? "rgba(168, 85, 247, 0.15)" : "rgba(129, 140, 248, 0.15)", border: isAgency ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(129, 140, 248, 0.3)", color: isAgency ? "#d8b4fe" : "#a5b4fc", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", marginLeft: "0.5rem" }}
                >
                  {isAgency ? "Buy Credits" : "Upgrade"}
                </button>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(true);
                  setActiveView("builder");
                }}
                className="glow-btn"
                style={{
                  background: "linear-gradient(to right, #6366f1, #d946ef)",
                  color: "#fff",
                  padding: "0.6rem 1.2rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <Plus size={16} /> Create New Site
              </button>
            </div>
          </div>

          {/* Large Create Website Widget Card */}
          <div
            onClick={() => {
              setIsCreatingNew(true);
              setActiveView("builder");
            }}
            className="glass-card"
            style={{
              padding: "3rem",
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(217, 70, 239, 0.1))",
              cursor: "pointer",
              marginBottom: "3rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <div style={{ background: "rgba(99, 102, 241, 0.2)", width: "3.5rem", height: "3.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0 0.25rem 0" }}>🚀 Create New Website</h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", maxWidth: "600px", margin: 0 }}>
              Launch the step-by-step AI wizard. Choose Gaming, SaaS, Creator, Luxury or Fitness styles and build dynamic layouts instantly.
            </p>
          </div>

          {/* Recent projects grid */}
          <div style={{ marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "1.25rem", color: "#fff", fontWeight: 700, marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Recent Projects <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 500 }}>({projects.length} total)</span>
            </h2>
            
            {projects.length === 0 ? (
              <div style={{ padding: "3rem", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "0.75rem", textAlign: "center", color: "#9ca3af" }}>
                No projects built yet. Click Create New Site to begin!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {projects.slice(0, 6).map((p) => {
                  const styleVal = p.theme?.style || "Modern Startup";
                  return (
                    <div
                      key={p.id}
                      className="glass-panel"
                      style={{
                        padding: "1.5rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.2rem",
                        background: "rgba(13,19,35,0.4)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ color: "#fff", display: "block", fontSize: "1.1rem" }}>{p.name}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>Style: {styleVal}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            color: p.status === "PUBLISHED" ? "#34d399" : p.status === "FAILED" ? "#f87171" : "#f59e0b",
                            background: p.status === "PUBLISHED" ? "rgba(52,211,153,0.1)" : p.status === "FAILED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245,158,11,0.1)"
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      
                      <code style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {p.subdomain}.{baseDomain}
                      </code>

                      {p.status === "FAILED" && (
                        <div style={{ color: "#f87171", fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.05)", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid rgba(239, 68, 68, 0.1)", lineHeight: 1.4 }}>
                          <strong>Failure:</strong> {p.theme?.failureReason || "AI provider limits/error"}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setIsCreatingNew(false);
                          setActiveView("builder");
                        }}
                        className="secondary-action"
                        style={{ width: "100%", justifyContent: "center", fontSize: "0.85rem" }}
                      >
                        Open Builder Workspace <ArrowRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Draft vs Published lists */}
          {projects.length > 0 && (
            <div className="dashboard-columns-grid">
              
              {/* Draft Section */}
              <div>
                <h3 style={{ fontSize: "1.1rem", color: "#fff", fontWeight: 700, marginBottom: "1rem" }}>Draft Projects ({draftProjects.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {draftProjects.map(p => (
                    <div key={p.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ color: "#fff", display: "inline-flex", gap: "0.5rem", alignItems: "center", fontSize: "0.9rem" }}>
                            {p.name}
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", fontWeight: 700, color: p.status === "FAILED" ? "#f87171" : "#f59e0b", background: p.status === "FAILED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245,158,11,0.1)" }}>{p.status}</span>
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block" }}>{p.subdomain}.{baseDomain}</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                          <button
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setIsCreatingNew(false);
                              setActiveView("builder");
                            }}
                            style={{ border: "none", background: "none", color: "#818cf8", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            style={{ border: "none", background: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {p.status === "FAILED" && (
                        <div style={{ color: "#f87171", fontSize: "0.75rem", padding: "0.4rem 0.6rem", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "0.25rem" }}>
                          <strong>Reason:</strong> {p.theme?.failureReason || "AI provider limits/error"}
                        </div>
                      )}
                    </div>
                  ))}
                  {draftProjects.length === 0 && <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No draft projects.</span>}
                </div>
              </div>

              {/* Published Section */}
              <div>
                <h3 style={{ fontSize: "1.1rem", color: "#fff", fontWeight: 700, marginBottom: "1rem" }}>Published Projects ({publishedProjects.length})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {publishedProjects.map(p => (
                    <div key={p.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong style={{ color: "#fff", display: "block", fontSize: "0.9rem" }}>{p.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{p.subdomain}.{baseDomain}</span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <a href={`${protocol}://${p.subdomain}.${baseDomain}`} target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", fontSize: "0.8rem", fontWeight: 700 }}>
                          Visit ↗
                        </a>
                        <button
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsCreatingNew(false);
                            setActiveView("builder");
                          }}
                          style={{ border: "none", background: "none", color: "#818cf8", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          style={{ border: "none", background: "none", color: "#ef4444", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {publishedProjects.length === 0 && <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No published projects.</span>}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // UNIFIED BUILDER WORKSPACE VIEW RENDER
  // ----------------------------------------------------
  return (
    <div style={{ display: "flex", width: "100%", height: "calc(100vh - 70px)", background: "#070b13", overflow: "hidden" }}>
      {/* PERSISTENT LEFT SIDEBAR */}
      <div style={{
        width: sidebarCollapsed ? "64px" : "200px",
        minWidth: sidebarCollapsed ? "64px" : "200px",
        background: "rgba(10, 14, 23, 0.95)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1.5rem 0.5rem 0.5rem 0.5rem",
        transition: "width 0.2s, min-width 0.2s",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => {
              setActiveView("homepage");
              setIsCreatingNew(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Home size={16} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(true);
              setActiveView("builder");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: isCreatingNew ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: isCreatingNew ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <PlusCircle size={16} />
            {!sidebarCollapsed && <span>Create New</span>}
          </button>

          {user.role === "ADMIN" && (
            <a
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.375rem",
                color: "#9ca3af",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              <Shield size={16} />
              {!sidebarCollapsed && <span>Admin Console</span>}
            </a>
          )}

          {!isCreatingNew && currentProject && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />
              <span style={{ fontSize: "0.7rem", color: "#4b5563", fontWeight: 700, paddingLeft: "0.8rem", display: sidebarCollapsed ? "none" : "block" }}>
                WEBSITE EDITOR
              </span>

              <button
                type="button"
                onClick={() => setBuilderTab("chat")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "chat" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "chat" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <MessageSquare size={16} />
                {!sidebarCollapsed && <span>AI Chat</span>}
              </button>

              <button
                type="button"
                onClick={() => setBuilderTab("layers")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "layers" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "layers" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <Layers size={16} />
                {!sidebarCollapsed && <span>Sections</span>}
              </button>

              <button
                type="button"
                onClick={() => setBuilderTab("properties")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "properties" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "properties" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <Sliders size={16} />
                {!sidebarCollapsed && <span>Manual Edit</span>}
              </button>

              <button
                type="button"
                onClick={() => setBuilderTab("assets")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "assets" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "assets" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <Image size={16} />
                {!sidebarCollapsed && <span>Assets</span>}
              </button>

              <button
                type="button"
                onClick={() => setBuilderTab("settings")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "settings" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "settings" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <Settings size={16} />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.6rem 0.8rem",
            borderRadius: "0.375rem",
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>

      {/* Main content display container */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* 1. Header Control Bar */}
      <div className="builder-header-bar">
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => {
              setActiveView("homepage");
              setIsCreatingNew(false);
            }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#cbd5e1",
              padding: "0.4rem 0.8rem",
              borderRadius: "0.4rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>

          <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>

          {currentProject && !isCreatingNew && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Project:</span>
              <select
                className="premium-input"
                style={{ padding: "0.25rem 1.5rem 0.25rem 0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8rem", width: "auto", minHeight: "auto", height: "30px" }}
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

        {/* Action controls */}
        {currentProject && !isCreatingNew && (
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            
            {/* Split layout resizer control */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(255,255,255,0.02)", padding: "0.2rem", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                type="button"
                onClick={() => setSplitLayout("split")}
                style={{ background: splitLayout === "split" ? "rgba(129, 140, 248, 0.15)" : "none", border: "none", color: splitLayout === "split" ? "#818cf8" : "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                title="Split View (50/50)"
              >
                50:50
              </button>
              <button
                type="button"
                onClick={() => setSplitLayout("editor-focus")}
                style={{ background: splitLayout === "editor-focus" ? "rgba(129, 140, 248, 0.15)" : "none", border: "none", color: splitLayout === "editor-focus" ? "#818cf8" : "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                title="Focus Editor (70/30)"
              >
                Editor Wide
              </button>
              <button
                type="button"
                onClick={() => setSplitLayout("preview-focus")}
                style={{ background: splitLayout === "preview-focus" ? "rgba(129, 140, 248, 0.15)" : "none", border: "none", color: splitLayout === "preview-focus" ? "#818cf8" : "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                title="Focus Preview (30/70)"
              >
                Preview Wide
              </button>
              <button
                type="button"
                onClick={() => setSplitLayout("editor-only")}
                style={{ background: splitLayout === "editor-only" ? "rgba(129, 140, 248, 0.15)" : "none", border: "none", color: splitLayout === "editor-only" ? "#818cf8" : "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                title="Hide Preview"
              >
                Hide Preview
              </button>
              <button
                type="button"
                onClick={() => setSplitLayout("preview-only")}
                style={{ background: splitLayout === "preview-only" ? "rgba(129, 140, 248, 0.15)" : "none", border: "none", color: splitLayout === "preview-only" ? "#818cf8" : "#9ca3af", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                title="Hide Editor"
              >
                Hide Editor
              </button>
            </div>
            
            {/* AI Credits remaining */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", background: "rgba(255, 255, 255, 0.02)", padding: "0.3rem 0.8rem", borderRadius: "0.4rem", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                AI Credits: <strong style={{ color: "#a855f7" }}>{remainingCredits} left</strong>
              </div>
              <button
                onClick={() => {
                  setUpgradeModalOpen(true);
                  setBuyCreditsView(isAgency);
                }}
                style={{ background: isAgency ? "rgba(168, 85, 247, 0.15)" : "rgba(129, 140, 248, 0.15)", border: isAgency ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(129, 140, 248, 0.3)", color: isAgency ? "#d8b4fe" : "#a5b4fc", padding: "0.3rem 0.6rem", borderRadius: "0.4rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", height: "26px" }}
              >
                {isAgency ? "Buy Credits" : "Upgrade"}
              </button>
            </div>

            {/* Export trigger dropdown */}
            <div style={{ position: "relative" }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleExportZip(e.target.value as any);
                    e.target.value = ""; // reset
                  }
                }}
                className="premium-input"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  height: "32px",
                  padding: "0 1.5rem 0 0.75rem",
                  cursor: "pointer"
                }}
              >
                <option value="">Download Options</option>
                <option value="html">ZIP Archive (HTML/CSS/JS)</option>
                <option value="react">React components (Vite)</option>
                <option value="nextjs">Next.js App Router</option>
              </select>
            </div>

            {/* Publish Action button */}
            <button
              onClick={handlePublish}
              className="glow-btn"
              style={{
                background: "linear-gradient(to right, #10b981, #059669)",
                color: "#fff",
                padding: "0.4rem 1.2rem",
                borderRadius: "0.4rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
              }}
            >
              Publish
            </button>
          </div>
        )}

      </div>

      {isCreatingNew ? (
        <div style={{ flexGrow: 1, padding: "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>Create a new website with AI</h2>
                <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: "0.25rem 0 0 0" }}>Define parameters below and trigger code generation.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  if (projects.length > 0) {
                    setSelectedProjectId(projects[0].id);
                  } else {
                    setActiveView("homepage");
                  }
                }}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
            <GeneratorForm user={user} onSuccess={handleNewProjectGenerated} />
          </div>
        </div>
      ) : !currentProject ? (
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}>
          Select or create a website project.
        </div>
      ) : (
        <div className="builder-split-container">
          
          {/* Left Config Panel (Editor pane) */}
          {splitLayout !== "preview-only" && (
            <div style={{
              width: splitLayout === "editor-only" ? "100%" : splitLayout === "editor-focus" ? "70%" : splitLayout === "preview-focus" ? "30%" : "50%",
              flexGrow: 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              background: "rgba(10, 14, 23, 0.55)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem"
            }}>
                
                {/* Error / Success alert display banner */}
                {error && <div style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "0.6rem 1rem", borderRadius: "0.4rem", fontSize: "0.8rem", marginBottom: "1rem" }}>{error}</div>}
                {success && <div style={{ background: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.6rem 1rem", borderRadius: "0.4rem", fontSize: "0.8rem", marginBottom: "1rem" }}>{success}</div>}

                {/* TAB CONTENT: AI CHAT EDITOR */}
                {builderTab === "chat" && (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>AI Edit Workspace Chat</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                        Ask AI to modify hero text, append pages, adjust theme palettes, or add services/pricing blocks instantly.
                      </p>

                      {/* Chat Messages container */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "380px", overflowY: "auto", paddingRight: "0.5rem" }}>
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                              background: msg.sender === "user" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                              border: msg.sender === "user" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255,255,255,0.06)",
                              padding: "0.8rem 1rem",
                              borderRadius: "0.6rem",
                              fontSize: "0.85rem",
                              color: "#e2e8f0",
                              maxWidth: "85%",
                              lineHeight: 1.5
                            }}
                          >
                            {msg.text}
                          </div>
                        ))}
                        {chatLoading && (
                          <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.02)", padding: "0.8rem 1rem", borderRadius: "0.6rem", fontSize: "0.8rem", color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="animate-spin">◌</span> Generating dynamic code layout...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Prompt input Form */}
                    <form onSubmit={handleChatSubmit} style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          className="field"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="e.g. Change hero title to Play Now or Add pricing details"
                          disabled={chatLoading}
                          style={{ fontSize: "0.85rem" }}
                        />
                        <button type="submit" className="primary-action" style={{ minHeight: "auto", height: "38px", padding: "0 1rem" }} disabled={chatLoading}>
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB CONTENT: LAYERS PANEL */}
                {builderTab === "layers" && (
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Section Layers Manager</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                      Active sections on your homepage. Click a layer to target properties overrides manually.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {(currentProject.pages[0]?.sections || []).map((sec, i) => (
                        <div
                          key={sec.id}
                          onClick={() => setBuilderTab("properties")}
                          style={{
                            padding: "0.75rem 1rem",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "0.4rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <span>{i+1}. {sec.type}</span>
                          <span style={{ fontSize: "0.7rem", color: "#818cf8" }}>Configure ↗</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PROPERTIES OVERWRITES PANEL */}
                {builderTab === "properties" && (
                  <form onSubmit={handleManualSave} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Content Overwrite Panel</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0 }}>
                        Instantly customize active page headings and content details manually. These do not cost credits.
                      </p>
                    </div>

                    <div className="field-group">
                      <label>Website Name</label>
                      <input className="field" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Acme Studio" disabled={loading} />
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>HERO SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>Hero Heading</label>
                      <input className="field" value={heroHeading} onChange={(e) => setHeroHeading(e.target.value)} placeholder="Main Title" disabled={loading} />
                    </div>

                    <div className="field-group">
                      <label>Hero Subheading</label>
                      <textarea className="field" value={heroSubheading} onChange={(e) => setHeroSubheading(e.target.value)} placeholder="Subheading details" rows={3} disabled={loading} />
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

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>ABOUT SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>About Us Heading</label>
                      <input className="field" value={aboutHeading} onChange={(e) => setAboutHeading(e.target.value)} placeholder="Our Story" disabled={loading} />
                    </div>

                    <div className="field-group">
                      <label>About Us Body</label>
                      <textarea className="field" value={aboutBody} onChange={(e) => setAboutBody(e.target.value)} placeholder="Business details" rows={3} disabled={loading} />
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>CONTACT SECTION</span>
                    </div>

                    <div className="field-group">
                      <label>Contact Email Address</label>
                      <input className="field" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@company.com" disabled={loading} />
                    </div>

                    <button type="submit" className="primary-action" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }} disabled={loading}>
                      Apply Overwrite Changes
                    </button>
                  </form>
                )}

                {/* TAB CONTENT: ASSETS LIBRARY */}
                {builderTab === "assets" && (
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Visual Assets Library</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                      High-resolution visual assets. Copy any URL to update image fields inside AI edit chat or section settings.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{ width: "4rem", height: "4rem", background: "linear-gradient(to right, #6366f1, #d946ef)", borderRadius: "0.4rem" }}></div>
                        <div>
                          <strong style={{ display: "block", color: "#fff", fontSize: "0.85rem" }}>Gradient Vector Background</strong>
                          <code style={{ fontSize: "0.7rem", color: "#818cf8" }}>/assets/vector-gradient.png</code>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=150&q=80" alt="Tech" style={{ width: "4rem", height: "4rem", borderRadius: "0.4rem", objectFit: "cover" }} />
                        <div style={{ flexGrow: 1 }}>
                          <strong style={{ display: "block", color: "#fff", fontSize: "0.85rem" }}>Modern SaaS Workplace</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80");
                              setSuccess("Copied Image URL!");
                              setTimeout(() => setSuccess(""), 1500);
                            }}
                            style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", fontWeight: 700, padding: 0, marginTop: "0.2rem", cursor: "pointer" }}
                          >
                            Copy Image URL
                          </button>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80" alt="Gaming" style={{ width: "4rem", height: "4rem", borderRadius: "0.4rem", objectFit: "cover" }} />
                        <div style={{ flexGrow: 1 }}>
                          <strong style={{ display: "block", color: "#fff", fontSize: "0.85rem" }}>Professional Gaming Rig</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80");
                              setSuccess("Copied Image URL!");
                              setTimeout(() => setSuccess(""), 1500);
                            }}
                            style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", fontWeight: 700, padding: 0, marginTop: "0.2rem", cursor: "pointer" }}
                          >
                            Copy Image URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: SETTINGS SECTION */}
                {builderTab === "settings" && (
                  <div>
                    {/* Settings Navigation links */}
                    <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
                      <button onClick={() => setSettingsTab("general")} style={{ background: "none", border: "none", color: settingsTab === "general" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>General</button>
                      <button onClick={() => setSettingsTab("domains")} style={{ background: "none", border: "none", color: settingsTab === "domains" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Domains</button>
                      <button onClick={() => setSettingsTab("seo")} style={{ background: "none", border: "none", color: settingsTab === "seo" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>SEO</button>
                      <button onClick={() => setSettingsTab("analytics")} style={{ background: "none", border: "none", color: settingsTab === "analytics" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Analytics</button>
                      <button onClick={() => setSettingsTab("keys")} style={{ background: "none", border: "none", color: settingsTab === "keys" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>AI Keys</button>
                      {isAgencyOrAdmin && (
                        <button onClick={() => setSettingsTab("devkeys")} type="button" style={{ background: "none", border: "none", color: settingsTab === "devkeys" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Developer Keys</button>
                      )}
                    </div>

                    {/* Settings Form Container */}
                    <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      
                      {/* GENERAL SETTINGS */}
                      {settingsTab === "general" && (
                        <>
                          <h4 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>General Configuration</h4>
                          <div className="field-group">
                            <label>Preferred LLM Routing Engine</label>
                            <select className="field" value={preferredProvider} onChange={(e) => setPreferredProvider(e.target.value)}>
                              <option value="gemini">Gemini 3.5 Flash / 1.5 Pro</option>
                              <option value="claude">Anthropic Claude Sonnet</option>
                              <option value="openai">OpenAI GPT-4o</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* CUSTOM DOMAIN MANAGEMENT */}
                      {settingsTab === "domains" && (
                        <>
                          <h4 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>Website Subdomain</h4>
                          <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>
                            Customize the default subdomain address hosted on Webbing's servers.
                          </p>
                          
                          <div className="field-group" style={{ marginBottom: "1.5rem" }}>
                            <label>Subdomain Prefix</label>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <input 
                                className="field" 
                                value={projectSubdomain} 
                                onChange={(e) => {
                                  const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                  setProjectSubdomain(clean);
                                }} 
                                placeholder="my-website" 
                                style={{ flexGrow: 1 }} 
                              />
                              <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>.{baseDomain}</span>
                            </div>
                          </div>

                          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "1.5rem 0" }} />

                          <h4 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>Custom Domain Settings</h4>
                          <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>
                            Map a verified personal domain directly to your published website.
                          </p>
                          
                          <div className="field-group">
                            <label>Domain Name</label>
                            <input className="field" value={customDomainName} onChange={(e) => setCustomDomainName(e.target.value)} placeholder="e.g. brand.com" />
                          </div>
 
                          {customDomainName.trim() && (
                            <div style={{ background: "rgba(10, 14, 23, 0.4)", border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "1rem" }}>
                              <strong>Configure DNS Records on your Registrar:</strong>
                              
                              {/* Option 1: A Record */}
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <strong style={{ color: "#fff", display: "block", marginBottom: "0.4rem" }}>Option 1: Root Domain (e.g. brand.com)</strong>
                                <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af", fontSize: "0.7rem" }}>
                                  Add one or both of these <strong>A Records</strong> at your registrar DNS configuration:
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.5rem", borderRadius: "0.2rem" }}>
                                    <span>Type: <strong>A</strong> | Name: <strong>@</strong></span>
                                    <code style={{ color: "#a5b4fc" }}>187.127.172.170</code>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.5rem", borderRadius: "0.2rem" }}>
                                    <span>Type: <strong>A</strong> | Name: <strong>@</strong></span>
                                    <code style={{ color: "#a5b4fc" }}>2.57.91.91</code>
                                  </div>
                                </div>
                              </div>

                              {/* Option 2: CNAME */}
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <strong style={{ color: "#fff", display: "block", marginBottom: "0.4rem" }}>Option 2: Subdomain / www (e.g. www.brand.com)</strong>
                                <p style={{ margin: "0 0 0.5rem 0", color: "#9ca3af", fontSize: "0.7rem" }}>
                                  Create a <strong>CNAME Record</strong> pointing to our proxy cluster:
                                </p>
                                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.5rem", borderRadius: "0.2rem" }}>
                                  <span>Type: <strong>CNAME</strong> | Name: <strong>www</strong></span>
                                  <code style={{ color: "#a5b4fc" }}>cname.webbing.in</code>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                                <button type="button" onClick={handleVerifyDns} className="glow-btn" style={{ background: "linear-gradient(to right, #6366f1, #4f46e5)", color: "#fff", padding: "0.35rem 0.8rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", border: "none" }} disabled={dnsVerifying}>
                                  {dnsVerifying ? "Verifying..." : "Verify DNS Connection"}
                                </button>
                                {dnsStatus && <span style={{ color: dnsStatus.includes("Success") || dnsStatus.includes("connected") || dnsStatus.includes("Active") ? "#34d399" : "#f87171", fontSize: "0.7rem", fontWeight: 600 }}>{dnsStatus}</span>}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* SEO SETTINGS */}
                      {settingsTab === "seo" && (
                        <>
                          <h4 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>Search Engine Optimization</h4>
                          <div className="field-group">
                            <label>Meta Title</label>
                            <input className="field" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO search result heading" />
                          </div>
                          <div className="field-group">
                            <label>Meta Description</label>
                            <textarea className="field" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Short search snippet content description" rows={3} />
                          </div>
                        </>
                      )}

                      {/* ANALYTICS SETTINGS */}
                      {settingsTab === "analytics" && (
                        <>
                          <h4 style={{ color: "#fff", margin: "0 0 0.5rem 0" }}>Tracking & Tag Analytics</h4>
                          <div className="field-group">
                            <label>Google Analytics Tag ID</label>
                            <input className="field" value={analyticsTag} onChange={(e) => setAnalyticsTag(e.target.value)} placeholder="e.g. G-XXXXXXX" />
                          </div>
                        </>
                      )}

                      {/* AI PROVIDERS BRING YOUR OWN KEYS */}
                      {settingsTab === "keys" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <h4 style={{ color: "#fff", margin: 0 }}>AI Provider Key Configurations</h4>
                          {keysLoading ? (
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Loading provider keys...</span>
                          ) : (
                            <div style={{ scale: "0.95", transformOrigin: "top left" }}>
                              <LlmKeyManager
                                initialKeys={llmKeys}
                                title="Platform LLM Keys"
                                description="Add OpenAI, Claude, or Gemini keys to route layout edits."
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* DEVELOPER API KEYS MANAGEMENT */}
                      {settingsTab === "devkeys" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h4 style={{ color: "#fff", margin: 0 }}>Developer API Keys</h4>
                            <button
                              type="button"
                              onClick={handleGenerateDevKey}
                              className="glow-btn"
                              style={{ background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "0.4rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                            >
                              + Generate New Key
                            </button>
                          </div>
                          
                          <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: "0 0 1rem 0", lineHeight: 1.4 }}>
                            Use developer keys to trigger site generation and editing programmatically. Authenticate your requests using:
                            <code style={{ display: "block", background: "rgba(0,0,0,0.3)", padding: "0.4rem", borderRadius: "0.25rem", color: "#a5b4fc", marginTop: "0.25rem", fontFamily: "monospace" }}>
                              Authorization: Bearer YOUR_API_KEY
                            </code>
                          </p>

                          {devKeysLoading ? (
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Loading developer keys...</span>
                          ) : devKeys.length === 0 ? (
                            <div style={{ padding: "1.5rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.5rem", textAlign: "center", color: "#6b7280", fontSize: "0.8rem" }}>
                              No active developer keys. Generate one above to get started.
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              {devKeys.map((k) => (
                                <div key={k.id} className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    <code style={{ fontSize: "0.8rem", color: "#fff", fontFamily: "monospace" }}>
                                      {k.key}
                                    </code>
                                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                      Created: {new Date(k.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeDevKey(k.id)}
                                    style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {settingsTab !== "keys" && settingsTab !== "devkeys" && (
                        <button type="submit" className="primary-action" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }} disabled={loading}>
                          {loading ? "Applying Settings..." : "Save Settings Configuration"}
                        </button>
                      )}

                    </form>
                  </div>
                )}

            </div>
          )}

        {/* Right Iframe preview workspace */}
        {splitLayout !== "editor-only" && (
          <div className="builder-preview-container" style={{
            width: splitLayout === "preview-only" ? "100%" : splitLayout === "preview-focus" ? "70%" : splitLayout === "editor-focus" ? "30%" : "50%",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column"
          }}>
          
          {/* Preview address indicator header */}
          <div style={{ padding: "0.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b0f19" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>
              <Layout size={14} />
              <span>Interactive Live Preview Workspace</span>
              {currentProject && (
                <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", color: currentProject.status === "PUBLISHED" ? "#34d399" : "#a855f7", fontSize: "0.75rem", fontWeight: 700 }}>
                  {currentProject.status}
                </span>
              )}
            </div>

            {currentProject && !isCreatingNew && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  Workspace URL: <a href={activeSiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>{currentProject.subdomain}.{baseDomain} <ExternalLink size={12} /></a>
                </span>
                
                <button
                  onClick={handleRefreshPreview}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff",
                    borderRadius: "0.25rem",
                    padding: "0.3rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Reload Preview iframe"
                >
                  <RefreshCw size={12} className={currentProject.status === "GENERATING" ? "animate-spin" : ""} />
                </button>
              </div>
            )}
          </div>

          {/* Iframe Viewport mapping */}
          <div style={{ flexGrow: 1, padding: "1.25rem", display: "flex", justifyContent: "center", alignItems: "stretch", overflow: "hidden" }}>
            {currentProject && !isCreatingNew ? (
              currentProject.status === "GENERATING" || (currentProject.status === "DRAFT" && (!currentProject.pages || currentProject.pages.length === 0)) ? (
                <div style={{ flexGrow: 1, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1.5rem" }}>
                  <RefreshCw size={32} className="animate-spin" color="#818cf8" />
                  <strong style={{ fontSize: "1.2rem", color: "#fff" }}>Orchestrating layout generation...</strong>
                  <GenerationProgress createdAt={currentProject.createdAt} />
                </div>
              ) : currentProject.status === "FAILED" ? (
                <div style={{ flexGrow: 1, background: "#0b0f19", border: "1px solid rgba(239, 68, 68, 0.06)", borderRadius: "0.75rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1.5rem", padding: "2rem" }}>
                  <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle size={32} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <h3 style={{ fontSize: "1.25rem", color: "#fff", margin: "0 0 0.5rem 0" }}>Generation Failed</h3>
                    <p style={{ color: "#f87171", fontSize: "0.9rem", maxWidth: "450px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", padding: "1rem", borderRadius: "0.5rem", wordBreak: "break-word", margin: 0 }}>
                      <strong>Reason:</strong> {currentProject.theme?.failureReason || "AI generation timeout or provider limits."}
                    </p>
                  </div>
                  <button onClick={() => handleRetryGeneration(currentProject)} className="primary-action" style={{ background: "linear-gradient(to right, #ef4444, #dc2626)", color: "#fff", border: "none" }}>
                    <RefreshCw size={14} style={{ marginRight: "0.5rem" }} /> Retry Generation
                  </button>
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
                <span>Configure the creation wizard settings to generate your first website layout.</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      )}
      </div>

      {/* 3. Publishing Checks overlay modal */}
      {publishModalOpen && currentProject && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7, 11, 19, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "520px", padding: "2.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "1.25rem" }}>Deploying Web Project</h3>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Verifying SSL certificates, active routing pathways, and assets check.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {publishProgress.map((step, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {step.status === "running" && <RefreshCw size={16} className="animate-spin" color="#818cf8" />}
                    {step.status === "success" && <CheckCircle size={16} color="#34d399" />}
                    {step.status === "error" && <AlertTriangle size={16} color="#ef4444" />}
                    {step.status === "pending" && <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }}></div>}
                    <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>{step.name}</span>
                  </div>
                  {step.error && <span style={{ fontSize: "0.75rem", color: "#f87171" }}>{step.error}</span>}
                </div>
              ))}
            </div>

            {/* Publishing result card */}
            {publishResult === "success" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem", textAlign: "center" }}>
                  🎉 <strong>Website Published Successfully!</strong>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#cbd5e1" }}>Your production routing SSL certificates are validated.</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <a href={activeSiteUrl} target="_blank" rel="noopener noreferrer" className="primary-action" style={{ flex: 1, justifyContent: "center" }}>
                    Visit Live Site ↗
                  </a>
                  <button onClick={() => setPublishModalOpen(false)} className="secondary-action" style={{ flex: 1, justifyContent: "center" }}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {publishResult === "error" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem", textAlign: "center" }}>
                  ❌ <strong>Publishing Aborted</strong>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#cbd5e1" }}>One or more system route checks returned error states.</p>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={handlePublish} className="primary-action" style={{ flex: 1, justifyContent: "center" }}>
                    Retry Checks
                  </button>
                  <button onClick={() => setPublishModalOpen(false)} className="secondary-action" style={{ flex: 1, justifyContent: "center" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. Upgrade Subscription plans modal */}
      {/* 4. Upgrade Subscription plans modal */}
      {upgradeModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7, 11, 19, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1.5rem", overflowY: "auto" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "600px", padding: "2.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxHeight: "90vh", overflowY: "auto", margin: "auto" }}>
            <div>
              <span className="eyebrow" style={{ color: "#c084fc" }}>Billing Portal</span>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "1.35rem" }}>
                {isAgency ? "Buy Extra Credits" : "SaaS Account Upgrade & Billing"}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                {isAgency 
                  ? "Purchase extra credit packs to keep generating websites on your Agency plan." 
                  : "Choose a pricing plan to increase your AI credits quota or purchase extra credits."}
              </p>
            </div>

            {upgradeMessage && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem" }}>
                {upgradeMessage}
              </div>
            )}

            {upgradeError && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem" }}>
                {upgradeError}
              </div>
            )}

            {!selectedUpgradePlan ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Tab Selector: Only show if user can buy credits and is NOT on agency plan (since Agency has only credits purchase anyway) */}
                {canBuyCredits && !isAgency && (
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "0.25rem" }}>
                    <button 
                      type="button"
                      onClick={() => setBuyCreditsView(false)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        background: !buyCreditsView ? "rgba(129, 140, 248, 0.15)" : "transparent",
                        border: "none",
                        color: !buyCreditsView ? "#fff" : "#9ca3af",
                        borderRadius: "0.35rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Subscription Plans
                    </button>
                    <button 
                      type="button"
                      onClick={() => setBuyCreditsView(true)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        background: buyCreditsView ? "rgba(168, 85, 247, 0.15)" : "transparent",
                        border: "none",
                        color: buyCreditsView ? "#fff" : "#9ca3af",
                        borderRadius: "0.35rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Buy Extra Credits
                    </button>
                  </div>
                )}

                {/* Billing Cycle Switcher: Only show when looking at Subscription Plans and NOT in buy credits view */}
                {!buyCreditsView && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", color: billingCycle === "monthly" ? "#fff" : "#9ca3af" }}>Monthly</span>
                    <button
                      type="button"
                      onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
                      style={{
                        width: "48px",
                        height: "24px",
                        borderRadius: "12px",
                        background: billingCycle === "annually" ? "#818cf8" : "rgba(255,255,255,0.15)",
                        border: "none",
                        position: "relative",
                        cursor: "pointer",
                        padding: 0,
                        transition: "background 0.2s"
                      }}
                    >
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "3px",
                        left: billingCycle === "annually" ? "27px" : "3px",
                        transition: "left 0.2s"
                      }} />
                    </button>
                    <span style={{ fontSize: "0.85rem", color: billingCycle === "annually" ? "#fff" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      Annually <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.35rem", borderRadius: "10px", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", fontWeight: 700 }}>Save up to 15%</span>
                    </span>
                  </div>
                )}

                {/* Cards Display List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {buyCreditsView ? (
                    // Display Extra Credit Packs
                    <>
                      {[
                        { id: "credits-10", name: "10 Credits Pack", creditsLimit: 10, price: 99, features: "Adds 10 AI generation credits to your account immediately" },
                        { id: "credits-50", name: "50 Credits Pack", creditsLimit: 50, price: 399, features: "Adds 50 AI generation credits to your account immediately" },
                        { id: "credits-100", name: "100 Credits Pack", creditsLimit: 100, price: 699, features: "Adds 100 AI generation credits to your account immediately" },
                      ].map((pack) => (
                        <div key={pack.id} style={{ padding: "1.25rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ color: "#fff", display: "block", fontSize: "1rem" }}>
                              {pack.name}
                            </strong>
                            <span style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "block", margin: "0.2rem 0" }}>₹{pack.price} • {pack.creditsLimit} Credits</span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{pack.features}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedUpgradePlan(pack)}
                            className="glow-btn"
                            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700 }}
                          >
                            Buy Pack
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Display Subscription Plans
                    initialPlans.map((plan: any) => {
                      const planKey = plan.name.toLowerCase().replace(/\s+/g, "-");
                      const isCurrent = tenant.subscription?.planId === planKey;

                      // Starter has no annual version or discount
                      if (planKey === "starter") {
                        if (billingCycle === "annually") return null; // hide starter on annual view
                        return (
                          <div key={plan.id} style={{ padding: "1.25rem", background: "rgba(255,255,255,0.01)", border: isCurrent ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong style={{ color: "#fff", display: "block", fontSize: "1rem" }}>
                                {plan.name} {isCurrent && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", background: "rgba(129,140,248,0.15)", color: "#818cf8", marginLeft: "0.5rem" }}>Current Plan</span>}
                              </strong>
                              <span style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "block", margin: "0.2rem 0" }}>Free • {plan.creditsLimit} monthly credits</span>
                              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{plan.features}</span>
                            </div>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => setSelectedUpgradePlan({ ...plan, id: planKey })}
                                className="glow-btn"
                                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700 }}
                              >
                                Select Plan
                              </button>
                            )}
                          </div>
                        );
                      }

                      // Adjust name, pricing, and note for billing cycle
                      let displayPrice = `₹${plan.price}/month`;
                      let amount = plan.price;
                      let planName = plan.name;
                      let discountBadge = null;
                      let customId = planKey;

                      if (billingCycle === "annually") {
                        if (planKey === "pro-plan") {
                          displayPrice = "₹6,468/year";
                          amount = 6468;
                          planName = "Pro Plan (Annually)";
                          discountBadge = "10% Discount Applied";
                          customId = "pro-plan-annual";
                        } else if (planKey === "agency") {
                          displayPrice = "₹25,488/year";
                          amount = 25488;
                          planName = "Agency (Annually)";
                          discountBadge = "15% Discount Applied";
                          customId = "agency-annual";
                        }
                      }

                      return (
                        <div key={plan.id} style={{ padding: "1.25rem", background: "rgba(255,255,255,0.01)", border: isCurrent ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ color: "#fff", display: "block", fontSize: "1rem" }}>
                              {planName} {isCurrent && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem", borderRadius: "0.25rem", background: "rgba(129,140,248,0.15)", color: "#818cf8", marginLeft: "0.5rem" }}>Current Plan</span>}
                              {discountBadge && <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(34,197,94,0.15)", color: "#4ade80", marginLeft: "0.5rem", fontWeight: 700 }}>{discountBadge}</span>}
                            </strong>
                            <span style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "block", margin: "0.2rem 0" }}>
                              {displayPrice} • {plan.creditsLimit} monthly credits
                              {billingCycle === "annually" && (
                                <span style={{ color: "#9ca3af", display: "block", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                                  Equivalent to ₹{planKey === "pro-plan" ? "539" : "2124"}/month
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{plan.features}</span>
                          </div>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setSelectedUpgradePlan({ ...plan, id: customId, price: amount, name: planName })}
                              className="glow-btn"
                              style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", fontWeight: 700 }}
                            >
                              Select Plan
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(false)}
                  className="secondary-action"
                  style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmUpgrade} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>SELECTED PLAN</span>
                  <strong style={{ color: "#fff", display: "block", fontSize: "1.1rem" }}>{selectedUpgradePlan.name}</strong>
                  <span style={{ fontSize: "0.9rem", color: "#818cf8", display: "block" }}>Amount to Pay: <strong>₹{selectedUpgradePlan.price}</strong></span>
                </div>

                {selectedUpgradePlan.price > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "#cbd5e1", textAlign: "center" }}>
                      Scan the QR code below using any UPI app (GPay, PhonePe, Paytm, BHIM, etc.) to complete payment:
                    </span>
                    
                    {/* Dynamic QR Code Render */}
                    <div style={{ background: "#fff", padding: "1rem", borderRadius: "1rem", display: "inline-flex" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=${upiId}&pn=Webbing&am=${selectedUpgradePlan.price}&cu=INR&tn=Webbing%20Upgrade%20${selectedUpgradePlan.id || selectedUpgradePlan.name}`
                        )}`}
                        alt="UPI QR Code"
                        style={{ width: "180px", height: "180px" }}
                      />
                    </div>
                    
                    <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>UPI ID: <strong>{upiId}</strong></span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>UPI TRANSACTION REFERENCE ID (UTR - 12 DIGITS)</label>
                      <input
                        type="text"
                        className="premium-input"
                        placeholder="e.g. 625123956841"
                        value={utrCode}
                        onChange={(e) => setUtrCode(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        required
                        pattern="\d{12}"
                        style={{ width: "100%" }}
                        disabled={submittingRequest}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>Are you sure you want to downgrade/switch to the free Starter plan?</p>
                )}

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(null)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                    disabled={submittingRequest}
                  >
                    Back to Plans
                  </button>
                  <button
                    type="submit"
                    className="glow-btn"
                    style={{ background: "linear-gradient(to right, #6366f1, #d946ef)", color: "#fff", padding: "0.6rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? "Submitting..." : "Confirm payment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
