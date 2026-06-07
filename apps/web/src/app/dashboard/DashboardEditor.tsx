"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, Check, Server, RefreshCw, Sparkles, Globe, Edit2, Play, Download, Layout, ArrowLeft, Plus, MessageSquare, Layers, Sliders, Image, LogOut, CheckCircle, AlertTriangle, ExternalLink, Shield, ArrowRight, Trash2, ChevronLeft, ChevronRight, PlusCircle, Home, Menu, Mail, Users, DollarSign, Percent } from "lucide-react";
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
  contactSubmissions?: any[];
}

interface DashboardEditorProps {
  user: {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    referredBy?: string | null;
    affiliateCode?: string | null;
  };
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
  initialSettings?: any;
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

export default function DashboardEditor({ user, tenant, baseDomain, protocol, initialPlans = [], upiId = "pogakula@ybl", initialSettings }: DashboardEditorProps) {
  const appName = initialSettings?.appName || "Webbing";
  const appLogo = initialSettings?.appLogo || "";
  const [projects, setProjects] = useState<Project[]>(tenant.projects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeView, setActiveView] = useState<"homepage" | "builder">("homepage");
  const [isCreatingNew, setIsCreatingNew] = useState(tenant.projects.length === 0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [splitLayout, setSplitLayout] = useState<"split" | "editor-focus" | "preview-focus" | "editor-only" | "preview-only">("split");
  const [isMobile, setIsMobile] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50); // percentage (e.g. 50%)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevProjectIdRef = useRef(selectedProjectId);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      let newWidthPercentage = (mouseX / rect.width) * 100;
      
      // Enforce bounds (20% to 80%)
      if (newWidthPercentage < 20) newWidthPercentage = 20;
      if (newWidthPercentage > 80) newWidthPercentage = 80;
      
      setEditorWidth(newWidthPercentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isMobile) {
      if (splitLayout !== "editor-only" && splitLayout !== "preview-only") {
        setSplitLayout("editor-only");
      }
    } else {
      setSplitLayout("split");
    }
  }, [isMobile]);

  // Upgrade Plan states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);
  const [utrCode, setUtrCode] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [upgradeError, setUpgradeError] = useState("");
  const [buyCreditsView, setBuyCreditsView] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  // Feedback states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"BUG" | "FEEDBACK">("FEEDBACK");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState("");
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState("");

  // Change password states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  // Auto collapse sidebar on mobile screen widths
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Left Panel Sidebar Tabs
  const [builderTab, setBuilderTab] = useState<"chat" | "layers" | "properties" | "assets" | "settings" | "leads">("chat");
  const [customAssets, setCustomAssets] = useState<any[]>([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  // Settings sub-tab
  const [settingsTab, setSettingsTab] = useState<"general" | "domains" | "seo" | "analytics" | "keys" | "devkeys" | "policies">("general");

  // Policies settings state
  const [privacyPolicyEnabled, setPrivacyPolicyEnabled] = useState(false);
  const [privacyPolicyText, setPrivacyPolicyText] = useState("");
  const [termsEnabled, setTermsEnabled] = useState(false);
  const [termsText, setTermsText] = useState("");
  const [refundPolicyEnabled, setRefundPolicyEnabled] = useState(false);
  const [refundPolicyText, setRefundPolicyText] = useState("");

  // Affiliate & Payout states
  const [homeSubView, setHomeSubView] = useState<"projects" | "affiliate">("projects");
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [referralsLog, setReferralsLog] = useState<any[]>([]);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [loadingAffiliate, setLoadingAffiliate] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState("");
  const [payoutError, setPayoutError] = useState("");

  // Refund request states
  const [refundEligibility, setRefundEligibility] = useState<any>(null);
  const [loadingRefundStatus, setLoadingRefundStatus] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundMessage, setRefundMessage] = useState("");
  const [refundError, setRefundError] = useState("");

  // Selected Project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Iframe Refresh Key
  const [iframeKey, setIframeKey] = useState(0);

  // Load state from URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get("project");
      const viewParam = params.get("view");
      const tabParam = params.get("tab");
      const newParam = params.get("new");
      const subviewParam = params.get("subview");
      
      if (projectParam) {
        setSelectedProjectId(projectParam);
        setIsCreatingNew(false);
      }
      if (viewParam === "builder" || viewParam === "homepage") {
        setActiveView(viewParam);
      }
      if (newParam === "true") {
        setIsCreatingNew(true);
      }
      if (tabParam && ["chat", "layers", "properties", "assets", "settings", "leads"].includes(tabParam)) {
        setBuilderTab(tabParam as any);
      }
      if (subviewParam === "affiliate" || subviewParam === "projects") {
        setHomeSubView(subviewParam as any);
      }
    }
  }, []);

  // Sync state back to URL parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      if (selectedProjectId) {
        params.set("project", selectedProjectId);
      } else {
        params.delete("project");
      }
      
      if (activeView) {
        params.set("view", activeView);
      } else {
        params.delete("view");
      }
      
      if (activeView === "builder") {
        if (isCreatingNew) {
          params.set("new", "true");
          params.delete("project");
        } else {
          params.delete("new");
        }
        
        if (builderTab) {
          params.set("tab", builderTab);
        } else {
          params.delete("tab");
        }
      } else {
        params.delete("new");
        params.delete("tab");
      }
      
      if (activeView === "homepage" && homeSubView) {
        params.set("subview", homeSubView);
      } else {
        params.delete("subview");
      }
      
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedProjectId, activeView, builderTab, isCreatingNew, homeSubView]);

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
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedSectionContent, setSelectedSectionContent] = useState<any>({});

  useEffect(() => {
    if (selectedSection) {
      setSelectedSectionContent(selectedSection.content || {});
    } else {
      setSelectedSectionContent({});
    }
  }, [selectedSection]);

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
      setSelectedSection(null);
      
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
      // Only clear messages when switching to a different project
      if (prevProjectIdRef.current !== selectedProjectId) {
        setError("");
        setSuccess("");
        setDnsStatus("");
        setSubdomainStatus("");
        prevProjectIdRef.current = selectedProjectId;
      }

      setPreferredProvider(currentProject.theme?.preferredProvider || "gemini");
      setAnalyticsTag(currentProject.theme?.analyticsTag || "");
    }
  }, [selectedProjectId, projects]);

  // Load custom assets
  useEffect(() => {
    if (selectedProjectId) {
      fetch(`/api/projects/${selectedProjectId}/assets`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.assets) {
            setCustomAssets(data.assets);
          }
        })
        .catch((err) => console.error("Failed to fetch custom assets:", err));
    } else {
      setCustomAssets([]);
    }
  }, [selectedProjectId]);

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
            metadata: {
              ...(currentProject.theme as any)?.metadata,
              policies: {
                privacyPolicyEnabled,
                privacyPolicyText,
                termsEnabled,
                termsText,
                refundPolicyEnabled,
                refundPolicyText
              }
            }
          },
          seo: {
            title: seoTitle,
            description: seoDescription,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project settings.");

      if (data.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === data.project.id ? { ...p, ...data.project } : p))
        );
        setCustomDomainName(data.project.customDomain?.hostname || "");
        setProjectSubdomain(data.project.subdomain || "");
      }

      setSuccess("Settings applied successfully!");
      handleRefreshPreview();
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setSelectedSectionContent((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayFieldChange = (arrayKey: string, index: number, fieldKey: string, value: any) => {
    setSelectedSectionContent((prev: any) => {
      const arr = Array.isArray(prev[arrayKey]) ? [...prev[arrayKey]] : [];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...arr[index], [fieldKey]: value };
      return {
        ...prev,
        [arrayKey]: arr
      };
    });
  };

  // Submit Manual Properties overrides
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {
        name: manualName,
      };

      if (selectedSection) {
        payload.sectionId = selectedSection.id;
        payload.sectionContent = selectedSectionContent;
      } else {
        payload.hero = {
          heading: heroHeading,
          subheading: heroSubheading,
          ctaText: heroCtaText,
          ctaUrl: heroCtaUrl,
        };
        payload.about = {
          heading: aboutHeading,
          body: aboutBody,
        };
        payload.contactEmail = contactEmail;
      }

      const res = await fetch(`/api/projects/${currentProject.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply content changes.");

      setSuccess("Manual content applied!");
      handleRefreshPreview();
      
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== currentProject.id) return p;

          let updatedPages = p.pages;
          if (selectedSection) {
            // Update the specific section in client state
            updatedPages = p.pages.map((page) => {
              const updatedSections = page.sections.map((sec) => {
                if (sec.id === selectedSection.id) {
                  return { ...sec, content: selectedSectionContent };
                }
                return sec;
              });
              return { ...page, sections: updatedSections };
            });
          } else {
            // Update hero, about, and contact in client state
            updatedPages = p.pages.map((page) => {
              const updatedSections = page.sections.map((sec) => {
                if (sec.type === "HERO") {
                  return { ...sec, content: { ...sec.content, heading: heroHeading, subheading: heroSubheading, ctaText: heroCtaText, ctaUrl: heroCtaUrl } };
                }
                if (sec.type === "ABOUT") {
                  return { ...sec, content: { ...sec.content, heading: aboutHeading, body: aboutBody } };
                }
                if (sec.type === "CONTACT") {
                  return { ...sec, content: { ...sec.content, email: contactEmail } };
                }
                return sec;
              });
              return { ...page, sections: updatedSections };
            });
          }

          return { ...p, name: manualName, pages: updatedPages };
        })
      );

      if (selectedSection) {
        setSelectedSection((prev: any) => prev ? { ...prev, content: selectedSectionContent } : null);
      }

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

  // Synchronize Policy Settings when currentProject changes
  useEffect(() => {
    if (currentProject) {
      const policies = (currentProject.theme as any)?.metadata?.policies || {};
      setPrivacyPolicyEnabled(!!policies.privacyPolicyEnabled);
      setPrivacyPolicyText(policies.privacyPolicyText || "");
      setTermsEnabled(!!policies.termsEnabled);
      setTermsText(policies.termsText || "");
      setRefundPolicyEnabled(!!policies.refundPolicyEnabled);
      setRefundPolicyText(policies.refundPolicyText || "");
    }
  }, [selectedProjectId, projects]);

  const fetchAffiliateData = async () => {
    setLoadingAffiliate(true);
    try {
      const res = await fetch("/api/payments/payout");
      const data = await res.json();
      if (data.success) {
        setAffiliateStats(data.stats);
        setReferralsLog(data.referralsLog || []);
        setPayoutsList(data.payouts || []);
      }
    } catch (err) {
      console.error("Error fetching affiliate data:", err);
    } finally {
      setLoadingAffiliate(false);
    }
  };

  useEffect(() => {
    if (activeView === "homepage" && homeSubView === "affiliate") {
      fetchAffiliateData();
    }
  }, [activeView, homeSubView]);

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError("");
    setPayoutMessage("");
    if (!upiIdInput || !withdrawAmount) {
      setPayoutError("UPI ID and amount are required.");
      return;
    }
    const amountNum = parseInt(withdrawAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayoutError("Please enter a valid amount.");
      return;
    }
    setSubmittingPayout(true);
    try {
      const res = await fetch("/api/payments/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: upiIdInput, amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        setPayoutMessage(data.message);
        setWithdrawAmount("");
        fetchAffiliateData(); // reload stats
      } else {
        setPayoutError(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setPayoutError("An error occurred. Please try again.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  const checkRefundEligibility = async () => {
    setLoadingRefundStatus(true);
    try {
      const res = await fetch("/api/payments/refund");
      const data = await res.json();
      setRefundEligibility(data);
    } catch (err) {
      console.error("Error checking refund eligibility:", err);
    } finally {
      setLoadingRefundStatus(false);
    }
  };

  useEffect(() => {
    if (upgradeModalOpen) {
      checkRefundEligibility();
    }
  }, [upgradeModalOpen]);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError("");
    setRefundMessage("");
    if (!confirm("Are you sure you want to cancel your plan? This will downgrade your workspace to the Free tier immediately and submit a refund verification request.")) return;
    setSubmittingRefund(true);
    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        setRefundMessage(data.message || "Plan cancelled successfully.");
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        setRefundError(data.error || "Failed to cancel subscription.");
      }
    } catch (err) {
      setRefundError("An error occurred. Please try again.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Submit payment request for upgrade
  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;
    setSubmittingRequest(true);
    setUpgradeMessage("");
    setUpgradeError("");
    const hasReferrer = !!user.referredBy;
    const finalAmount = hasReferrer ? Math.round(selectedUpgradePlan.price * 0.9) : selectedUpgradePlan.price;
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedUpgradePlan.id || selectedUpgradePlan.name.toLowerCase().replace(/\s+/g, "-"),
          amount: finalAmount,
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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackMessage.trim()) return;
    setSubmittingFeedback(true);
    setFeedbackSuccessMsg("");
    setFeedbackErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          title: feedbackTitle,
          message: feedbackMessage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback.");
      setFeedbackSuccessMsg("Thank you! Your feedback has been submitted successfully.");
      setFeedbackTitle("");
      setFeedbackMessage("");
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackSuccessMsg("");
      }, 2500);
    } catch (err: any) {
      setFeedbackErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setChangePasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters long.");
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setChangePasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => {
          setChangePasswordOpen(false);
          setChangePasswordSuccess("");
        }, 1500);
      } else {
        setChangePasswordError(data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      setChangePasswordError("An unexpected error occurred.");
    } finally {
      setChangePasswordLoading(false);
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

  const renderModals = () => {
    return (
      <>
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
        
                    {/* Referral Discount Banner */}
                    {!!user.referredBy && (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "0.5rem", padding: "0.75rem 1rem", color: "#4ade80", fontSize: "0.85rem", fontWeight: 600 }}>
                        <Sparkles size={16} />
                        <span>10% Referral Discount Applied! Discount is automatically subtracted from payment totals.</span>
                      </div>
                    )}
        
                    {/* Current Active Plan & Refund Section */}
                    {tenant.subscription && tenant.subscription.planId !== "free-plan" && tenant.subscription.planId !== "starter" && (
                      <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block" }}>CURRENT ACTIVE PLAN</span>
                            <strong style={{ color: "#fff", display: "block", fontSize: "1.1rem", textTransform: "capitalize" }}>
                              {tenant.subscription.planId.replace("-plan", "").replace("-annual", " Annual")}
                            </strong>
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                              Credits: {tenant.subscription.creditsUsed} / {tenant.subscription.creditsLimit} used
                            </span>
                          </div>
                          <div>
                            {refundEligibility && refundEligibility.eligible && (
                              <button
                                type="button"
                                onClick={handleRefundSubmit}
                                disabled={submittingRefund}
                                className="danger-action"
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 700 }}
                              >
                                {submittingRefund ? "Processing..." : "Cancel & Refund"}
                              </button>
                            )}
                          </div>
                        </div>
        
                        {/* Refund quote calculations display */}
                        {refundEligibility && refundEligibility.eligible && (
                          <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#f87171" }}>
                            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Eligible for cancellation & credit-deducted refund:</div>
                            <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.4 }}>
                              <li>Original payment: ₹{refundEligibility.amountPaid}</li>
                              <li>Credits used: {refundEligibility.creditsUsed} (deducted at ₹{Math.round(refundEligibility.deductAmount / (refundEligibility.creditsUsed || 1))} per credit)</li>
                              <li>Deduction amount: -₹{refundEligibility.deductAmount}</li>
                              <li>Estimated net refund: <strong>₹{refundEligibility.refundAmount}</strong></li>
                              <li>Refund window expires in: <strong>{refundEligibility.daysRemaining} days</strong></li>
                            </ul>
                          </div>
                        )}
        
                        {refundMessage && (
                          <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem" }}>
                            {refundMessage}
                          </div>
                        )}
        
                        {refundError && (
                          <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem" }}>
                            {refundError}
                          </div>
                        )}
                      </div>
                    )}
        
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
                                if (planKey === "individual-plan") {
                                  displayPrice = "₹2,040/year";
                                  amount = 2040;
                                  planName = "Individual Plan (Annually)";
                                  discountBadge = "5% Discount Applied";
                                  customId = "individual-plan-annual";
                                } else if (planKey === "pro-plan") {
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
                                          Equivalent to ₹{planKey === "individual-plan" ? "170" : (planKey === "pro-plan" ? "539" : "2124")}/month
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
                        {(() => {
                          const hasReferrer = !!user.referredBy;
                          const finalPrice = hasReferrer ? Math.round(selectedUpgradePlan.price * 0.9) : selectedUpgradePlan.price;
                          return (
                            <>
                              <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.04)" }}>
                                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>SELECTED PLAN</span>
                                <strong style={{ color: "#fff", display: "block", fontSize: "1.1rem" }}>{selectedUpgradePlan.name}</strong>
                                <span style={{ fontSize: "0.9rem", color: "#818cf8", display: "block" }}>
                                  Amount to Pay: <strong>₹{finalPrice}</strong>
                                  {hasReferrer && <span style={{ color: "#4ade80", fontSize: "0.75rem", marginLeft: "0.5rem" }}>(10% Referrer Discount Applied)</span>}
                                </span>
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
                                        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(appName)}&am=${finalPrice}&cu=INR&tn=${encodeURIComponent(appName + " Upgrade " + (selectedUpgradePlan.id || selectedUpgradePlan.name))}`
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
                            </>
                          );
                        })()}
        
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
        
              {/* Feedback / Bug Report Modal */}
              {feedbackModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7, 11, 19, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1.5rem" }}>
                  <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "2.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <span className="eyebrow" style={{ color: "#c084fc" }}>Support & Suggestions</span>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "1.35rem" }}>Submit Feedback or Bug</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Help us improve {appName}. Report bugs or suggest new product features.</p>
                    </div>
        
                    {feedbackSuccessMsg && (
                      <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem" }}>
                        {feedbackSuccessMsg}
                      </div>
                    )}
        
                    {feedbackErrorMsg && (
                      <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem" }}>
                        {feedbackErrorMsg}
                      </div>
                    )}
        
                    <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>REPORT TYPE</label>
                        <select
                          className="premium-input"
                          value={feedbackType}
                          onChange={(e: any) => setFeedbackType(e.target.value)}
                          style={{ width: "100%" }}
                        >
                          <option value="FEEDBACK">Suggestion / Feedback</option>
                          <option value="BUG">Bug Report</option>
                        </select>
                      </div>
        
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TITLE</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={feedbackTitle}
                          onChange={(e) => setFeedbackTitle(e.target.value)}
                          placeholder="e.g. Broken links in ecommerce settings"
                          required
                          style={{ width: "100%" }}
                          disabled={submittingFeedback}
                        />
                      </div>
        
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>MESSAGE / DETAILS</label>
                        <textarea
                          className="premium-input"
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                          placeholder="Describe the issue or feedback in detail..."
                          required
                          rows={4}
                          style={{ width: "100%", resize: "none" }}
                          disabled={submittingFeedback}
                        />
                      </div>
        
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => setFeedbackModalOpen(false)}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                          disabled={submittingFeedback}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="glow-btn"
                          style={{ background: "linear-gradient(to right, #6366f1, #d946ef)", color: "#fff", padding: "0.6rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                          disabled={submittingFeedback}
                        >
                          {submittingFeedback ? "Submitting..." : "Submit Report"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        
              {/* Change Password Modal */}
              {changePasswordOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7, 11, 19, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1.5rem" }}>
                  <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem", borderRadius: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <span className="eyebrow" style={{ color: "#818cf8" }}>Security settings</span>
                      <h3 style={{ margin: 0, color: "#fff", fontSize: "1.35rem" }}>Change Password</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Update your password to secure your {appName} account.</p>
                    </div>
        
                    {changePasswordSuccess && (
                      <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem" }}>
                        {changePasswordSuccess}
                      </div>
                    )}
        
                    {changePasswordError && (
                      <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem" }}>
                        {changePasswordError}
                      </div>
                    )}
        
                    <form onSubmit={handleChangePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>CURRENT PASSWORD</label>
                        <input
                          type="password"
                          className="premium-input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                          style={{ width: "100%" }}
                          disabled={changePasswordLoading}
                        />
                      </div>
        
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>NEW PASSWORD</label>
                        <input
                          type="password"
                          className="premium-input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          style={{ width: "100%" }}
                          disabled={changePasswordLoading}
                        />
                      </div>
        
                      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => setChangePasswordOpen(false)}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                          disabled={changePasswordLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="glow-btn"
                          style={{ background: "linear-gradient(to right, #6366f1, #d946ef)", color: "#fff", padding: "0.6rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                          disabled={changePasswordLoading}
                        >
                          {changePasswordLoading ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        
      </>
    );
  };

  // ----------------------------------------------------
  // HOMEPAGE VIEW RENDER
  // ----------------------------------------------------
  if (activeView === "homepage") {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh", background: "#0a0e17", overflow: "hidden" }}>
        {/* Persistent Site Header (Main Menu) */}
        <header className="site-nav dashboard-nav" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: 0, background: "rgba(10, 14, 23, 0.95)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1.5rem", height: "70px", flexShrink: 0 }}>
          <a className="brand" href="/">
            {appLogo ? (
              <img src={appLogo} alt={appName} style={{ height: "24px", maxWidth: "100px", objectFit: "contain", marginRight: "0.25rem" }} />
            ) : (
              <span className="brand-mark"><Sparkles size={18} /></span>
            )}
            {appName}
          </a>
          
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            {/* AI Credits remaining and Upgrade Option */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.85rem", height: "34px", boxSizing: "border-box" }}>
              <span style={{ color: "#9ca3af" }}>AI Credits: <strong style={{ color: "#818cf8" }}>{remainingCredits} left</strong></span>
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

            <div className="nav-actions" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
              <a className="danger-action" href="/api/auth/signout">Sign out</a>
            </div>
          </div>
        </header>

        <div style={{ display: "flex", width: "100%", height: "calc(100vh - 70px)", background: "#070b13", overflow: "hidden", position: "relative" }}>
        {/* Mobile sidebar backdrop mask */}
        {isMobile && !sidebarCollapsed && (
          <div 
            onClick={() => setSidebarCollapsed(true)} 
            style={{
              position: "fixed",
              top: "70px",
              left: 0,
              width: "100vw",
              height: "calc(100vh - 70px)",
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 40
            }}
          />
        )}

        {/* PERSISTENT LEFT SIDEBAR */}
        <div style={{
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: isMobile ? "70px" : "auto",
          height: isMobile ? "calc(100vh - 70px)" : "100%",
          zIndex: isMobile ? 50 : "auto",
          width: isMobile ? (sidebarCollapsed ? "0px" : "200px") : (sidebarCollapsed ? "64px" : "200px"),
          minWidth: isMobile ? (sidebarCollapsed ? "0px" : "200px") : (sidebarCollapsed ? "64px" : "200px"),
          background: "rgba(10, 14, 23, 0.98)",
          borderRight: isMobile && sidebarCollapsed ? "none" : "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isMobile && sidebarCollapsed ? "0" : "1.5rem 0.5rem 0.5rem 0.5rem",
          transition: "width 0.2s, min-width 0.2s, padding 0.2s",
          flexShrink: 0,
          overflow: isMobile && sidebarCollapsed ? "hidden" : "visible"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={() => {
                setActiveView("homepage");
                setHomeSubView("projects");
                setIsCreatingNew(false);
                if (isMobile) setSidebarCollapsed(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.375rem",
                background: (activeView === "homepage" && homeSubView === "projects") ? "rgba(129, 140, 248, 0.08)" : "none",
                border: "none",
                color: (activeView === "homepage" && homeSubView === "projects") ? "#818cf8" : "#9ca3af",
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
                if (isMobile) setSidebarCollapsed(true);
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
                onClick={() => {
                  if (isMobile) setSidebarCollapsed(true);
                }}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              onClick={() => {
                setActiveView("homepage");
                setHomeSubView("affiliate");
                setIsCreatingNew(false);
                if (isMobile) setSidebarCollapsed(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.8rem",
                borderRadius: "0.375rem",
                background: (activeView === "homepage" && homeSubView === "affiliate") ? "rgba(129, 140, 248, 0.08)" : "none",
                border: "none",
                color: (activeView === "homepage" && homeSubView === "affiliate") ? "#818cf8" : "#9ca3af",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <Percent size={16} />
              {!sidebarCollapsed && <span>Affiliate Program</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setFeedbackModalOpen(true);
                setFeedbackSuccessMsg("");
                setFeedbackErrorMsg("");
                setFeedbackTitle("");
                setFeedbackMessage("");
                if (isMobile) setSidebarCollapsed(true);
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
              <MessageSquare size={16} />
              {!sidebarCollapsed && <span>Submit Feedback</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setChangePasswordOpen(true);
                setChangePasswordError("");
                setChangePasswordSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                if (isMobile) setSidebarCollapsed(true);
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
              <Shield size={16} />
              {!sidebarCollapsed && <span>Change Password</span>}
            </button>

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
        </div>

        <div style={{ flexGrow: 1, padding: isMobile ? "1.25rem" : "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
          {homeSubView === "affiliate" ? (
            <main style={{ maxWidth: "1000px", margin: "0 auto", color: "#fff" }}>
              {/* Affiliate Dashboard header */}
              <div style={{ marginBottom: "2rem" }}>
                <span className="eyebrow" style={{ color: "#818cf8" }}>Partner Program</span>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 850, margin: "0.25rem 0", color: "#fff" }}>{appName} Affiliate Center</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0 }}>
                  Refer users to {appName}. They get <strong style={{ color: "#34d399" }}>10% discount</strong> on any purchase/renewal. You earn <strong style={{ color: "#818cf8" }}>20% commission</strong> on their first purchase and <strong style={{ color: "#818cf8" }}>10% recurring commission</strong> on all renewals!
                </p>
              </div>

              {/* Referral Link & Code Panel */}
              <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", marginBottom: "2rem" }}>
                <h3 style={{ margin: "0 0 1rem 0" }}>Your Unique Referral Link</h3>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <input
                    readOnly
                    value={`${protocol}://${baseDomain}/signup?ref=${user.affiliateCode || ""}`}
                    className="field"
                    style={{ flexGrow: 1, fontFamily: "monospace", fontSize: "0.85rem", background: "rgba(0,0,0,0.2)" }}
                    onClick={(e) => (e.target as any).select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${protocol}://${baseDomain}/signup?ref=${user.affiliateCode || ""}`);
                      alert("Referral link copied to clipboard!");
                    }}
                    className="secondary-action"
                    style={{ whiteSpace: "nowrap", padding: "0.6rem 1rem" }}
                  >
                    Copy Link
                  </button>
                </div>
                <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                  Share this link. Your partner code is <strong style={{ color: "#818cf8" }}>{user.affiliateCode}</strong>
                </div>
              </div>

              {loadingAffiliate ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>Loading affiliate stats...</div>
              ) : (
                <>
                  {/* Earnings Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", borderRadius: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block" }}>Total Commissions Earned</span>
                      <strong style={{ fontSize: "2rem", color: "#fff", display: "block", marginTop: "0.5rem" }}>
                        ₹{(affiliateStats?.totalEarned || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", borderRadius: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#a5b4fc", display: "block" }}>Pending (Within Refund Period)</span>
                      <strong style={{ fontSize: "2rem", color: "#818cf8", display: "block", marginTop: "0.5rem" }}>
                        ₹{(affiliateStats?.pendingBalance || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem", borderRadius: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#86efac", display: "block" }}>Net Available for Payout</span>
                      <strong style={{ fontSize: "2rem", color: "#34d399", display: "block", marginTop: "0.5rem" }}>
                        ₹{(affiliateStats?.availableBalance || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {/* Form & History columns */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", alignItems: "start" }}>
                    
                    {/* Withdraw Form */}
                    <div className="glass-panel" style={{ padding: "2rem", borderRadius: "0.75rem" }}>
                      <h3 style={{ margin: "0 0 1rem 0" }}>Request Payout</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.4, margin: "0 0 1.5rem 0" }}>
                        Commissions become mature and withdrawable after the 10-day customer refund window closes.
                      </p>

                      {payoutMessage && (
                        <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "0.85rem", marginBottom: "1rem" }}>
                          {payoutMessage}
                        </div>
                      )}

                      {payoutError && (
                        <div style={{ padding: "0.75rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.85rem", marginBottom: "1rem" }}>
                          {payoutError}
                        </div>
                      )}

                      <form onSubmit={handlePayoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="field-group">
                          <label>UPI ID or PhonePe/GPay UPI number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 9876543210@ybl or username@okaxis"
                            className="field"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                          />
                        </div>
                        <div className="field-group">
                          <label>Withdrawal Amount (INR)</label>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                              type="number"
                              required
                              min={1}
                              max={affiliateStats?.availableBalance || 0}
                              placeholder="e.g. 500"
                              className="field"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              style={{ flexGrow: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => setWithdrawAmount(String(affiliateStats?.availableBalance || 0))}
                              className="secondary-action"
                              style={{ fontSize: "0.8rem", padding: "0 1rem" }}
                            >
                              Max
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="glow-btn"
                          disabled={submittingPayout || (affiliateStats?.availableBalance || 0) <= 0}
                          style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
                        >
                          {submittingPayout ? "Submitting..." : `Withdraw ₹${parseInt(withdrawAmount || "0").toLocaleString()}`}
                        </button>
                      </form>
                    </div>

                    {/* Referrals Log */}
                    <div className="glass-panel" style={{ padding: "2rem", borderRadius: "0.75rem", maxHeight: "400px", overflowY: "auto" }}>
                      <h3 style={{ margin: "0 0 1rem 0" }}>Referral & Commission Log</h3>
                      {referralsLog.length === 0 ? (
                        <div style={{ color: "#6b7280", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>No referrals recorded yet.</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {referralsLog.map((log) => (
                            <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <div>
                                <span style={{ fontSize: "0.85rem", color: "#fff", display: "block" }}>{log.refereeEmail}</span>
                                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                  {log.planId.replace("-annual", " Annual")} • {new Date(log.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <strong style={{ fontSize: "0.9rem", color: "#34d399", display: "block" }}>+₹{log.amount}</strong>
                                <span style={{
                                  fontSize: "0.7rem",
                                  padding: "0.1rem 0.35rem",
                                  borderRadius: "10px",
                                  background: log.status === "CANCELLED" ? "rgba(239, 68, 68, 0.15)" : log.status === "AVAILABLE" || log.status === "WITHDRAWN" ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
                                  color: log.status === "CANCELLED" ? "#f87171" : log.status === "AVAILABLE" || log.status === "WITHDRAWN" ? "#4ade80" : "#facc15"
                                }}>
                                  {log.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payout History Log */}
                  <div className="glass-panel" style={{ padding: "2rem", borderRadius: "0.75rem", marginTop: "2rem" }}>
                    <h3 style={{ margin: "0 0 1rem 0" }}>Payout History</h3>
                    {payoutsList.length === 0 ? (
                      <div style={{ color: "#6b7280", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>No payout requests submitted yet.</div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: "#cbd5e1" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                            <th style={{ padding: "0.5rem" }}>Date</th>
                            <th style={{ padding: "0.5rem" }}>UPI ID</th>
                            <th style={{ padding: "0.5rem" }}>Amount</th>
                            <th style={{ padding: "0.5rem" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payoutsList.map((payout) => (
                            <tr key={payout.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding: "0.75rem 0.5rem" }}>{new Date(payout.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>{payout.upiId}</td>
                              <td style={{ padding: "0.75rem 0.5rem" }}>₹{payout.amount}</td>
                              <td style={{ padding: "0.75rem 0.5rem" }}>
                                <span style={{
                                  fontSize: "0.7rem",
                                  padding: "0.15rem 0.4rem",
                                  borderRadius: "10px",
                                  fontWeight: 700,
                                  background: payout.status === "APPROVED" ? "rgba(34, 197, 94, 0.15)" : payout.status === "REJECTED" ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)",
                                  color: payout.status === "APPROVED" ? "#4ade80" : payout.status === "REJECTED" ? "#f87171" : "#facc15"
                                }}>
                                  {payout.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </main>
          ) : (
            <main style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* Header row */}
          <div className="dashboard-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {isMobile && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.4rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Menu size={18} />
                </button>
              )}
              <div>
                <span className="eyebrow" style={{ color: "#818cf8" }}>Dashboard</span>
                <h1 style={{ fontSize: "clamp(1.3rem, 4.5vw, 2.25rem)", fontWeight: 850, margin: "0.25rem 0", color: "#fff", wordBreak: "break-word" }}>Welcome back, {user.email}</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Create, customize, publish and export your dynamic web sites.</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginTop: isMobile ? "0.5rem" : "0" }}>
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
                  if (isMobile) setSidebarCollapsed(true);
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
      )}
      {renderModals()}
      </div>
      </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // UNIFIED BUILDER WORKSPACE VIEW RENDER
  // ----------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh", background: "#0a0e17", overflow: "hidden" }}>
      {/* Persistent Site Header (Main Menu) */}
      <header className="site-nav dashboard-nav" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: 0, background: "rgba(10, 14, 23, 0.95)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 1.5rem", height: "70px", flexShrink: 0 }}>
        <a className="brand" href="/">
          {appLogo ? (
            <img src={appLogo} alt={appName} style={{ height: "24px", maxWidth: "100px", objectFit: "contain", marginRight: "0.25rem" }} />
          ) : (
            <span className="brand-mark"><Sparkles size={18} /></span>
          )}
          {appName}
        </a>
        
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {/* AI Credits remaining and Upgrade Option */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "0.4rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.85rem", height: "34px", boxSizing: "border-box" }}>
            <span style={{ color: "#9ca3af" }}>AI Credits: <strong style={{ color: "#818cf8" }}>{remainingCredits} left</strong></span>
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

          <div className="nav-actions" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
            <a className="danger-action" href="/api/auth/signout">Sign out</a>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", width: "100%", height: "calc(100vh - 70px)", background: "#070b13", overflow: "hidden", position: "relative" }}>
      {/* Mobile sidebar backdrop mask */}
      {isMobile && !sidebarCollapsed && (
        <div 
          onClick={() => setSidebarCollapsed(true)} 
          style={{
            position: "fixed",
            top: "70px",
            left: 0,
            width: "100vw",
            height: "calc(100vh - 70px)",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 40
          }}
        />
      )}

      {/* PERSISTENT LEFT SIDEBAR */}
      <div style={{
        position: isMobile ? "fixed" : "relative",
        left: 0,
        top: isMobile ? "70px" : "auto",
        height: isMobile ? "calc(100vh - 70px)" : "100%",
        zIndex: isMobile ? 50 : "auto",
        width: isMobile ? (sidebarCollapsed ? "0px" : "200px") : (sidebarCollapsed ? "64px" : "200px"),
        minWidth: isMobile ? (sidebarCollapsed ? "0px" : "200px") : (sidebarCollapsed ? "64px" : "200px"),
        background: "rgba(10, 14, 23, 0.98)",
        borderRight: isMobile && sidebarCollapsed ? "none" : "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isMobile && sidebarCollapsed ? "0" : "1.5rem 0.5rem 0.5rem 0.5rem",
        transition: "width 0.2s, min-width 0.2s, padding 0.2s",
        flexShrink: 0,
        overflow: isMobile && sidebarCollapsed ? "hidden" : "visible"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => {
              setActiveView("homepage");
              setIsCreatingNew(false);
              if (isMobile) setSidebarCollapsed(true);
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
              if (isMobile) setSidebarCollapsed(true);
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
              onClick={() => {
                if (isMobile) setSidebarCollapsed(true);
              }}
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
                onClick={() => {
                  setBuilderTab("chat");
                  if (isMobile) setSidebarCollapsed(true);
                }}
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
                onClick={() => {
                  setBuilderTab("layers");
                  if (isMobile) setSidebarCollapsed(true);
                }}
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
                onClick={() => {
                  setBuilderTab("properties");
                  if (isMobile) setSidebarCollapsed(true);
                }}
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
                onClick={() => {
                  setBuilderTab("assets");
                  if (isMobile) setSidebarCollapsed(true);
                }}
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
                onClick={() => {
                  setBuilderTab("leads");
                  if (isMobile) setSidebarCollapsed(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "0.375rem",
                  background: builderTab === "leads" ? "rgba(129, 140, 248, 0.08)" : "none",
                  border: "none",
                  color: builderTab === "leads" ? "#818cf8" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <Mail size={16} />
                {!sidebarCollapsed && <span>Leads</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setBuilderTab("settings");
                  if (isMobile) setSidebarCollapsed(true);
                }}
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

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={() => {
              setChangePasswordOpen(true);
              setChangePasswordError("");
              setChangePasswordSuccess("");
              setCurrentPassword("");
              setNewPassword("");
              if (isMobile) setSidebarCollapsed(true);
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
            <Shield size={16} />
            {!sidebarCollapsed && <span>Change Password</span>}
          </button>

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
      </div>

      {/* Main content display container */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* 1. Header Control Bar */}
      <div className="builder-header-bar" style={{
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        padding: isMobile ? "0.6rem" : "0.8rem 1.5rem",
        gap: "0.5rem"
      }}>
        {/* Row 1: Sidebar Toggle, Project selector, Layout Toggles */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          justifyContent: "space-between",
          width: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexGrow: 1 }}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "0.4rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Menu size={16} />
              </button>
            )}
            
            {currentProject && !isCreatingNew && (
              <select
                className="premium-input"
                style={{
                  padding: "0.25rem 1.5rem 0.25rem 0.5rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "0.75rem",
                  flexGrow: 1,
                  minHeight: "auto",
                  height: "30px",
                  maxWidth: isMobile ? "180px" : "250px"
                }}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Editor/Preview toggles for Mobile */}
          {isMobile && currentProject && !isCreatingNew && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(255,255,255,0.02)", padding: "0.2rem", borderRadius: "0.4rem", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                type="button"
                onClick={() => setSplitLayout("editor-only")}
                style={{
                  background: splitLayout === "editor-only" ? "rgba(129, 140, 248, 0.15)" : "none",
                  border: "none",
                  color: splitLayout === "editor-only" ? "#818cf8" : "#9ca3af",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setSplitLayout("preview-only")}
                style={{
                  background: splitLayout === "preview-only" ? "rgba(129, 140, 248, 0.15)" : "none",
                  border: "none",
                  color: splitLayout === "preview-only" ? "#818cf8" : "#9ca3af",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Preview
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Download Options, Publish Button (Mobile) or Actions inline (Desktop) */}
        {currentProject && !isCreatingNew && (
          <div style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            width: isMobile ? "100%" : "auto",
            justifyContent: "flex-end"
          }}>
            {/* Download Options */}
            <div style={{ flexGrow: isMobile ? 1 : 0 }}>
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
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  height: "32px",
                  width: "100%",
                  padding: "0 1.5rem 0 0.5rem",
                  cursor: "pointer"
                }}
              >
                <option value="">Download Options</option>
                <option value="html">ZIP Archive (HTML/CSS/JS)</option>
                <option value="react">React components (Vite)</option>
                <option value="nextjs">Next.js App Router</option>
              </select>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              className="glow-btn"
              style={{
                background: "linear-gradient(to right, #10b981, #059669)",
                color: "#fff",
                borderRadius: "0.4rem",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                height: "32px",
                padding: "0 1.2rem",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                flexGrow: isMobile ? 1 : 0
              }}
            >
              Publish
            </button>
          </div>
        )}
      </div>

      {isCreatingNew ? (
        <div style={{ flexGrow: 1, padding: "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
          <div style={{ maxWidth: "850px", margin: "0 auto" }}>
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
        <div ref={containerRef} className="builder-split-container">
          
          {/* Left Config Panel (Editor pane) */}
          {splitLayout !== "preview-only" && (
            <div style={{
              width: isMobile ? "100%" : splitLayout === "editor-only" ? "100%" : `${editorWidth}%`,
              flexGrow: 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: builderTab === "chat" ? "hidden" : "auto",
              background: "rgba(10, 14, 23, 0.55)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
              height: "100%",
              boxSizing: "border-box"
            }}>
                
                {/* Error / Success alert display banner */}
                {error && <div style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", padding: "0.6rem 1rem", borderRadius: "0.4rem", fontSize: "0.8rem", marginBottom: "1rem", flexShrink: 0 }}>{error}</div>}
                {success && <div style={{ background: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "0.6rem 1rem", borderRadius: "0.4rem", fontSize: "0.8rem", marginBottom: "1rem", flexShrink: 0 }}>{success}</div>}

                {/* TAB CONTENT: AI CHAT EDITOR */}
                {builderTab === "chat" && (
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
                    <div style={{ flexShrink: 0 }}>
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>AI Edit Workspace Chat</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                        Ask AI to modify hero text, append pages, adjust theme palettes, or add services/pricing blocks instantly.
                      </p>
                    </div>

                    {/* Chat Messages container */}
                    <div style={{ 
                      flexGrow: 1, 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "1rem", 
                      overflowY: "auto", 
                      paddingRight: "0.5rem",
                      marginBottom: "1rem"
                    }}>
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

                    {/* Chat Prompt input Form */}
                    <form onSubmit={handleChatSubmit} style={{ marginTop: "auto", flexShrink: 0 }}>
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
                          onClick={() => {
                            setSelectedSection(sec);
                            setBuilderTab("properties");
                          }}
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

                    <div className="field-group" style={{ marginBottom: "1rem" }}>
                      <label style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Active Section to Override</label>
                      <select
                        className="field"
                        value={selectedSection?.id || ""}
                        onChange={(e) => {
                          const secId = e.target.value;
                          const found = currentProject.pages[0]?.sections.find((s) => s.id === secId);
                          setSelectedSection(found || null);
                        }}
                        style={{
                          background: "rgba(10, 14, 23, 0.8)",
                          color: "#fff",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          width: "100%",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "0.375rem"
                        }}
                      >
                        <option value="">-- General Settings / All Sections --</option>
                        {(currentProject.pages[0]?.sections || []).map((sec: any) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.type} Section
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedSection ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>
                            MANUALLY OVERRIDING {selectedSection.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSection(null)}
                            style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            Back to General
                          </button>
                        </div>

                        {selectedSection.type === "HEADER" && (
                          <>
                            <div className="field-group">
                              <label>CTA Button Text</label>
                              <input className="field" value={selectedSectionContent.ctaText || ""} onChange={(e) => handleFieldChange("ctaText", e.target.value)} placeholder="Get Started" />
                            </div>
                            <div className="field-group">
                              <label>CTA Button Link</label>
                              <input className="field" value={selectedSectionContent.ctaUrl || ""} onChange={(e) => handleFieldChange("ctaUrl", e.target.value)} placeholder="#contact" />
                            </div>
                          </>
                        )}

                        {selectedSection.type === "HERO" && (
                          <>
                            <div className="field-group">
                              <label>Headline</label>
                              <input className="field" value={selectedSectionContent.heading || ""} onChange={(e) => handleFieldChange("heading", e.target.value)} placeholder="Headline Title" />
                            </div>
                            <div className="field-group">
                              <label>Subheading Description</label>
                              <textarea className="field" value={selectedSectionContent.subheading || ""} onChange={(e) => handleFieldChange("subheading", e.target.value)} placeholder="Value proposition details" rows={3} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                              <div className="field-group">
                                <label>CTA Button Text</label>
                                <input className="field" value={selectedSectionContent.ctaText || ""} onChange={(e) => handleFieldChange("ctaText", e.target.value)} placeholder="Contact Us" />
                              </div>
                              <div className="field-group">
                                <label>CTA Button Link</label>
                                <input className="field" value={selectedSectionContent.ctaUrl || ""} onChange={(e) => handleFieldChange("ctaUrl", e.target.value)} placeholder="#contact" />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                              <div className="field-group">
                                <label>Secondary CTA Text</label>
                                <input className="field" value={selectedSectionContent.secondaryCtaText || ""} onChange={(e) => handleFieldChange("secondaryCtaText", e.target.value)} placeholder="Learn More" />
                              </div>
                              <div className="field-group">
                                <label>Secondary CTA Link</label>
                                <input className="field" value={selectedSectionContent.secondaryCtaUrl || ""} onChange={(e) => handleFieldChange("secondaryCtaUrl", e.target.value)} placeholder="#features" />
                              </div>
                            </div>
                            <div className="field-group">
                              <label>Visual Image URL</label>
                              <input className="field" value={selectedSectionContent.imageUrl || ""} onChange={(e) => handleFieldChange("imageUrl", e.target.value)} placeholder="Unsplash image URL" />
                            </div>
                          </>
                        )}

                        {selectedSection.type === "FEATURES" && (
                          <>
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Feature Items List</span>
                            {(Array.isArray(selectedSectionContent.items) ? selectedSectionContent.items : [
                              { title: "Smart Generation", description: "Creates sections and copywriting aligned with your niche prompt details." },
                              { title: "Vibrant Styling", description: "Glassmorphic interfaces, tailored grid schemes, and custom color presets." },
                              { title: "Production Ready", description: "Optimized HTML/CSS structure ready for hosting or custom exports." }
                            ]).map((item: any, idx: number) => (
                              <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <strong style={{ fontSize: "0.75rem", color: "#818cf8" }}>Feature Card {idx + 1}</strong>
                                <div className="field-group">
                                  <label>Title</label>
                                  <input className="field" value={item?.title || ""} onChange={(e) => handleArrayFieldChange("items", idx, "title", e.target.value)} placeholder="Feature title" />
                                </div>
                                <div className="field-group">
                                  <label>Description</label>
                                  <textarea className="field" value={item?.description || ""} onChange={(e) => handleArrayFieldChange("items", idx, "description", e.target.value)} placeholder="Feature description" rows={2} />
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedSection.type === "SERVICES" && (
                          <>
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Services List</span>
                            {(Array.isArray(selectedSectionContent.services) ? selectedSectionContent.services : [
                              { title: "Core Design", desc: "Premium styling matching your specific target niche.", badge: "Popular" },
                              { title: "Subdomain Mapping", desc: "Instant deployment with fully configured system records." },
                              { title: "SEO Configurations", desc: "Automated search engine description meta tags." }
                            ]).map((srv: any, idx: number) => (
                              <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <strong style={{ fontSize: "0.75rem", color: "#818cf8" }}>Service {idx + 1}</strong>
                                <div className="field-group">
                                  <label>Title</label>
                                  <input className="field" value={srv?.title || ""} onChange={(e) => handleArrayFieldChange("services", idx, "title", e.target.value)} placeholder="Service Title" />
                                </div>
                                <div className="field-group">
                                  <label>Description</label>
                                  <textarea className="field" value={srv?.desc || ""} onChange={(e) => handleArrayFieldChange("services", idx, "desc", e.target.value)} placeholder="Service description" rows={2} />
                                </div>
                                <div className="field-group">
                                  <label>Badge (Optional)</label>
                                  <input className="field" value={srv?.badge || ""} onChange={(e) => handleArrayFieldChange("services", idx, "badge", e.target.value)} placeholder="Popular / New" />
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedSection.type === "TESTIMONIALS" && (
                          <>
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Testimonials List</span>
                            {(Array.isArray(selectedSectionContent.testimonials) ? selectedSectionContent.testimonials : [
                              { quote: "This builder completely changed how we test landing pages. The visual aesthetics are incredible.", author: "Sarah Jenkins", role: "Product Director" },
                              { quote: "Instant publishing with automatic SSL and DNS validations means we launch with complete peace of mind.", author: "Marcus Vance", role: "Creative Lead" }
                            ]).map((rev: any, idx: number) => (
                              <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <strong style={{ fontSize: "0.75rem", color: "#818cf8" }}>Review {idx + 1}</strong>
                                <div className="field-group">
                                  <label>Quote</label>
                                  <textarea className="field" value={rev?.quote || ""} onChange={(e) => handleArrayFieldChange("testimonials", idx, "quote", e.target.value)} placeholder="Quote text" rows={2} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                                  <div className="field-group">
                                    <label>Author Name</label>
                                    <input className="field" value={rev?.author || ""} onChange={(e) => handleArrayFieldChange("testimonials", idx, "author", e.target.value)} placeholder="Author" />
                                  </div>
                                  <div className="field-group">
                                    <label>Role/Company</label>
                                    <input className="field" value={rev?.role || ""} onChange={(e) => handleArrayFieldChange("testimonials", idx, "role", e.target.value)} placeholder="CEO at Acme" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedSection.type === "PRICING" && (
                          <>
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Pricing Plans</span>
                            {(Array.isArray(selectedSectionContent.plans) ? selectedSectionContent.plans : [
                              { name: "Starter", price: "$0", desc: "Ideal for testing layout setups." },
                              { name: "Pro Plan", price: "$29", desc: "Best for teams and content creators." },
                              { name: "Agency", price: "$99", desc: "For scaling client delivery." }
                            ]).map((pl: any, idx: number) => (
                              <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <strong style={{ fontSize: "0.75rem", color: "#818cf8" }}>Plan {idx + 1}</strong>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: "1rem" }}>
                                  <div className="field-group">
                                    <label>Plan Name</label>
                                    <input className="field" value={pl?.name || ""} onChange={(e) => handleArrayFieldChange("plans", idx, "name", e.target.value)} placeholder="Name" />
                                  </div>
                                  <div className="field-group">
                                    <label>Price</label>
                                    <input className="field" value={pl?.price || ""} onChange={(e) => handleArrayFieldChange("plans", idx, "price", e.target.value)} placeholder="$29" />
                                  </div>
                                </div>
                                <div className="field-group">
                                  <label>Short Description</label>
                                  <input className="field" value={pl?.desc || ""} onChange={(e) => handleArrayFieldChange("plans", idx, "desc", e.target.value)} placeholder="Starter details..." />
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedSection.type === "FAQS" && (
                          <>
                            <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>FAQ Items</span>
                            {(Array.isArray(selectedSectionContent.faqs) ? selectedSectionContent.faqs : [
                              { q: "How do custom domain integrations work?", a: "Save your hostname in settings, configure DNS records, and verify." },
                              { q: "Can I download static HTML archives?", a: "Yes. Use the download options menu on the control bar." }
                            ]).map((faq: any, idx: number) => (
                              <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <strong style={{ fontSize: "0.75rem", color: "#818cf8" }}>FAQ Question {idx + 1}</strong>
                                <div className="field-group">
                                  <label>Question</label>
                                  <input className="field" value={faq?.q || ""} onChange={(e) => handleArrayFieldChange("faqs", idx, "q", e.target.value)} placeholder="Question" />
                                </div>
                                <div className="field-group">
                                  <label>Answer</label>
                                  <textarea className="field" value={faq?.a || ""} onChange={(e) => handleArrayFieldChange("faqs", idx, "a", e.target.value)} placeholder="Answer explanation" rows={2} />
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {selectedSection.type === "CTA" && (
                          <>
                            <div className="field-group">
                              <label>Call to Action Title</label>
                              <input className="field" value={selectedSectionContent.heading || ""} onChange={(e) => handleFieldChange("heading", e.target.value)} placeholder="Ready to build your presence?" />
                            </div>
                            <div className="field-group">
                              <label>Subtitle Description</label>
                              <textarea className="field" value={selectedSectionContent.subheading || ""} onChange={(e) => handleFieldChange("subheading", e.target.value)} placeholder="Convert text detail" rows={2} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                              <div className="field-group">
                                <label>CTA Button Text</label>
                                <input className="field" value={selectedSectionContent.ctaText || ""} onChange={(e) => handleFieldChange("ctaText", e.target.value)} placeholder="Get Started" />
                              </div>
                              <div className="field-group">
                                <label>CTA Button Link</label>
                                <input className="field" value={selectedSectionContent.ctaUrl || ""} onChange={(e) => handleFieldChange("ctaUrl", e.target.value)} placeholder="#contact" />
                              </div>
                            </div>
                          </>
                        )}

                        {selectedSection.type === "ABOUT" && (
                          <>
                            <div className="field-group">
                              <label>Headline</label>
                              <input className="field" value={selectedSectionContent.heading || ""} onChange={(e) => handleFieldChange("heading", e.target.value)} placeholder="Our Story" />
                            </div>
                            <div className="field-group">
                              <label>About Us Description Text</label>
                              <textarea className="field" value={selectedSectionContent.body || ""} onChange={(e) => handleFieldChange("body", e.target.value)} placeholder="Who we are details..." rows={4} />
                            </div>
                            <div className="field-group">
                              <label>Image URL</label>
                              <input className="field" value={selectedSectionContent.imageUrl || ""} onChange={(e) => handleFieldChange("imageUrl", e.target.value)} placeholder="Unsplash image URL" />
                            </div>
                          </>
                        )}

                        {selectedSection.type === "CONTACT" && (
                          <>
                            <div className="field-group">
                              <label>Headline Title</label>
                              <input className="field" value={selectedSectionContent.heading || ""} onChange={(e) => handleFieldChange("heading", e.target.value)} placeholder="Start a Conversation" />
                            </div>
                            <div className="field-group">
                              <label>Contact Email Address</label>
                              <input className="field" type="email" value={selectedSectionContent.email || ""} onChange={(e) => handleFieldChange("email", e.target.value)} placeholder="hello@company.com" />
                            </div>
                            <div className="field-group">
                              <label>Contact Phone Number (Optional)</label>
                              <input className="field" value={selectedSectionContent.phone || ""} onChange={(e) => handleFieldChange("phone", e.target.value)} placeholder="+1 (555) 123-4567" />
                            </div>
                          </>
                        )}

                        {selectedSection.type === "FOOTER" && (
                          <div className="field-group">
                            <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Footer automatically renders copyright information matching the main website name.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
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

                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
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
                      </>
                    )}

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

                    {/* Upload custom assets */}
                    <div className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", color: "#fff", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>Upload Custom Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingAsset(true);
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("filename", file.name);
                          try {
                            const res = await fetch(`/api/projects/${currentProject.id}/assets`, {
                              method: "POST",
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success && data.asset) {
                              setCustomAssets(prev => [data.asset, ...prev]);
                              setSuccess("Uploaded custom image successfully!");
                              setTimeout(() => setSuccess(""), 2000);
                            } else {
                              setError(data.error || "Upload failed");
                              setTimeout(() => setError(""), 3000);
                            }
                          } catch (err: any) {
                            setError(err.message || "Upload error");
                            setTimeout(() => setError(""), 3000);
                          } finally {
                            setUploadingAsset(false);
                            // Clear input
                            e.target.value = "";
                          }
                        }}
                        style={{
                          fontSize: "0.8rem",
                          color: "#9ca3af",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px dashed rgba(255,255,255,0.15)",
                          borderRadius: "0.375rem",
                          padding: "0.5rem",
                          width: "100%",
                          cursor: "pointer"
                        }}
                        disabled={uploadingAsset}
                      />
                      {uploadingAsset && <span style={{ fontSize: "0.75rem", color: "#818cf8", display: "block", marginTop: "0.5rem" }}>Uploading image...</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Render custom assets */}
                      {customAssets.map((asset) => (
                        <div key={asset.id} className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                          <img src={asset.url} alt="Custom Asset" style={{ width: "4rem", height: "4rem", borderRadius: "0.4rem", objectFit: "cover" }} />
                          <div style={{ flexGrow: 1 }}>
                            <strong style={{ display: "block", color: "#fff", fontSize: "0.85rem", wordBreak: "break-all" }}>{asset.key.replace("uploads/", "")}</strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(asset.url);
                                setSuccess("Copied Image URL!");
                                setTimeout(() => setSuccess(""), 1500);
                              }}
                              style={{ background: "none", border: "none", color: "#818cf8", fontSize: "0.75rem", fontWeight: 700, padding: 0, marginTop: "0.2rem", cursor: "pointer" }}
                            >
                              Copy Image URL
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Default Hardcoded Assets */}
                      <div className="glass-panel" style={{ padding: "1rem", borderRadius: "0.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{ width: "4rem", height: "4rem", background: "linear-gradient(to right, #6366f1, #d946ef)", borderRadius: "0.4rem" }}></div>
                        <div>
                          <strong style={{ display: "block", color: "#fff", fontSize: "0.85rem" }}>Gradient Vector Background</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("/assets/vector-gradient.png");
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

                {/* TAB CONTENT: LEADS PANEL */}
                {builderTab === "leads" && (
                  <div>
                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Contact Submissions (Leads)</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                      View all inquiries submitted through the contact form on your published site.
                    </p>

                    {!currentProject.contactSubmissions || currentProject.contactSubmissions.length === 0 ? (
                      <div style={{ padding: "3rem", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "0.75rem", textAlign: "center", color: "#9ca3af" }}>
                        No submissions received yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {currentProject.contactSubmissions.map((sub: any) => (
                          <div 
                            key={sub.id} 
                            className="glass-panel" 
                            style={{ 
                              padding: "1.25rem", 
                              borderRadius: "0.75rem", 
                              border: "1px solid rgba(255,255,255,0.06)",
                              background: "rgba(13,19,35,0.4)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                              <div>
                                <strong style={{ color: "#fff", display: "block", fontSize: "0.95rem" }}>{sub.name}</strong>
                                <a href={`mailto:${sub.email}`} style={{ color: "#818cf8", fontSize: "0.8rem", textDecoration: "none" }}>{sub.email}</a>
                              </div>
                              <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                                {new Date(sub.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ 
                              color: "#cbd5e1", 
                              fontSize: "0.85rem", 
                              margin: 0, 
                              whiteSpace: "pre-wrap", 
                              lineHeight: 1.5,
                              background: "rgba(0,0,0,0.15)",
                              padding: "0.75rem",
                              borderRadius: "0.4rem"
                            }}>
                              {sub.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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
                      <button onClick={() => setSettingsTab("policies")} type="button" style={{ background: "none", border: "none", color: settingsTab === "policies" ? "#818cf8" : "#9ca3af", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Policies</button>
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
                            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>Domain Name</span>
                              {currentProject.customDomain?.verified && (
                                <span style={{ color: "#34d399", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                  ✓ Connected & Active
                                </span>
                              )}
                            </label>
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

                      {/* LEGAL POLICIES MANAGEMENT */}
                      {settingsTab === "policies" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <h4 style={{ color: "#fff", margin: 0 }}>Legal Policies Configurations</h4>
                          <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>
                            Toggle legal documents and write policy contents for your client website. Once enabled, visitors can access these at /privacy-policy, /terms-of-service, and /refund-policy.
                          </p>

                          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />

                          {/* Terms & Conditions */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 700 }}>Terms & Conditions Policy</label>
                              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" }}>
                                <input
                                  type="checkbox"
                                  checked={termsEnabled}
                                  onChange={(e) => setTermsEnabled(e.target.checked)}
                                  style={{ width: "16px", height: "16px" }}
                                />
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{termsEnabled ? "Enabled" : "Disabled"}</span>
                              </label>
                            </div>
                            {termsEnabled && (
                              <textarea
                                className="field"
                                rows={4}
                                placeholder="Describe the rules and guidelines for using your services..."
                                value={termsText}
                                onChange={(e) => setTermsText(e.target.value)}
                                style={{ fontSize: "0.8rem", width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem" }}
                              />
                            )}
                          </div>

                          {/* Privacy Policy */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 700 }}>Privacy Policy</label>
                              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" }}>
                                <input
                                  type="checkbox"
                                  checked={privacyPolicyEnabled}
                                  onChange={(e) => setPrivacyPolicyEnabled(e.target.checked)}
                                  style={{ width: "16px", height: "16px" }}
                                />
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{privacyPolicyEnabled ? "Enabled" : "Disabled"}</span>
                              </label>
                            </div>
                            {privacyPolicyEnabled && (
                              <textarea
                                className="field"
                                rows={4}
                                placeholder="Explain how user data is gathered, processed, and secured..."
                                value={privacyPolicyText}
                                onChange={(e) => setPrivacyPolicyText(e.target.value)}
                                style={{ fontSize: "0.8rem", width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem" }}
                              />
                            )}
                          </div>

                          {/* Refund Policy */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 700 }}>Refund Policy</label>
                              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "0.5rem" }}>
                                <input
                                  type="checkbox"
                                  checked={refundPolicyEnabled}
                                  onChange={(e) => setRefundPolicyEnabled(e.target.checked)}
                                  style={{ width: "16px", height: "16px" }}
                                />
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{refundPolicyEnabled ? "Enabled" : "Disabled"}</span>
                              </label>
                            </div>
                            {refundPolicyEnabled && (
                              <textarea
                                className="field"
                                rows={4}
                                placeholder="Detail subscription cancellations, credit usage deductions, and returns conditions..."
                                value={refundPolicyText}
                                onChange={(e) => setRefundPolicyText(e.target.value)}
                                style={{ fontSize: "0.8rem", width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem" }}
                              />
                            )}
                          </div>
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

        {/* Draggable Divider (Desktop only, Split view) */}
        {!isMobile && splitLayout !== "editor-only" && splitLayout !== "preview-only" && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: "6px",
              cursor: "col-resize",
              background: isDragging ? "rgba(129, 140, 248, 0.4)" : "rgba(255, 255, 255, 0.04)",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexShrink: 0,
              zIndex: 10,
            }}
            title="Drag to resize panels"
          >
            <div style={{
              width: "2px",
              height: "24px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "1px"
            }} />
          </div>
        )}

        {/* Right Iframe preview workspace */}
        {splitLayout !== "editor-only" && (
          <div className="builder-preview-container" style={{
            width: isMobile ? "100%" : splitLayout === "preview-only" ? "100%" : `${100 - editorWidth}%`,
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative"
          }}>
            
            {/* If dragging, render overlay to capture mouse events otherwise iframe absorbs them */}
            {isDragging && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                cursor: "col-resize",
                background: "transparent"
              }} />
            )}
          
          {/* Preview address indicator header */}
          <div style={{ padding: isMobile ? "0.4rem 0.75rem" : "0.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b0f19" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#9ca3af" }}>
              <Layout size={14} />
              {!isMobile && <span>Interactive Live Preview Workspace</span>}
              {currentProject && (
                <span style={{ background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", color: currentProject.status === "PUBLISHED" ? "#34d399" : "#a855f7", fontSize: "0.72rem", fontWeight: 700 }}>
                  {currentProject.status}
                </span>
              )}
            </div>

            {currentProject && !isCreatingNew && (
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.6rem" : "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                  {isMobile ? (
                    <a href={activeSiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                      Open Link <ExternalLink size={11} />
                    </a>
                  ) : (
                    <>Workspace URL: <a href={activeSiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>{currentProject.subdomain}.{baseDomain} <ExternalLink size={12} /></a></>
                  )}
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
      </div>

            {renderModals()}

    </div>
  );
}
