"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Shield, Plus, Trash2, Edit2, Sparkles, DollarSign, Layers, Users, Key, ChevronLeft, ChevronRight, Home, MessageSquare } from "lucide-react";
import PlanEditor from "./PlanEditor";
import LlmKeyManager from "../components/LlmKeyManager";

interface Plan {
  id: string;
  name: string;
  price: number;
  creditsLimit: number;
  features: string;
}

interface PaymentRequest {
  id: string;
  tenantId: string;
  planId: string;
  amount: number;
  utr: string;
  status: string;
  createdAt: string;
  tenant: {
    name: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: {
    name: string;
  };
}

interface AdminProject {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  selfHosted: boolean;
  tenant: {
    name: string;
  };
  customDomain: {
    hostname: string;
    verified: boolean;
  } | null;
}

interface AdminSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  creditsUsed: number;
  creditsLimit: number;
  withLlm: boolean;
  hostingType: string;
  domainType: string;
  tenant: {
    name: string;
  };
}

interface AdminConsoleProps {
  user: { userId: string; email: string; role: string; tenantId: string };
  users: AdminUser[];
  projects: AdminProject[];
  subscriptions: AdminSubscription[];
  totalTenants: number;
  llmKeys: any[];
  initialPlans: Plan[];
  initialRequests: PaymentRequest[];
  initialFeedbacks?: any[];
  initialUpiId: string;
  baseDomain: string;
  protocol: string;
}

export default function AdminConsole({
  user,
  users,
  projects,
  subscriptions,
  totalTenants,
  llmKeys,
  initialPlans,
  initialRequests,
  initialFeedbacks = [],
  initialUpiId,
  baseDomain,
  protocol,
}: AdminConsoleProps) {
  // States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "keys" | "plans" | "payments" | "feedback">("dashboard");
  const [upiId, setUpiId] = useState(initialUpiId);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests);
  const [feedbacks, setFeedbacks] = useState<any[]>(initialFeedbacks);

  const totalUsers = users.length;
  const totalSites = projects.length;
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;

  // Form states for adding/editing a Plan
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState(299);
  const [planCredits, setPlanCredits] = useState(100);
  const [planFeatures, setPlanFeatures] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Auto-clear notices
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Handle Save UPI ID
  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save UPI settings.");
      setMessage("Global UPI ID updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update UPI settings.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Plan (Create/Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlanId,
          name: planName,
          price: planPrice,
          creditsLimit: planCredits,
          features: planFeatures,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan.");

      if (editingPlanId) {
        setPlans(prev => prev.map(p => (p.id === editingPlanId ? data.plan : p)));
        setMessage("Plan updated successfully!");
      } else {
        setPlans(prev => [...prev, data.plan]);
        setMessage("New plan created successfully!");
      }

      // Reset form
      setEditingPlanId(null);
      setPlanName("");
      setPlanPrice(299);
      setPlanCredits(100);
      setPlanFeatures("");
    } catch (err: any) {
      setError(err.message || "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  // Start Editing Plan
  const startEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanPrice(plan.price);
    setPlanCredits(plan.creditsLimit);
    setPlanFeatures(plan.features);
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plan.");
      setPlans(prev => prev.filter(p => p.id !== id));
      setMessage("Plan deleted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to delete plan.");
    }
  };

  // Process Payment Request (Approve/Reject)
  const handleProcessPayment = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payment request?`)) return;
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} payment.`);

      setRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r))
      );
      setMessage(data.message || `Payment successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
    } catch (err: any) {
      setError(err.message || `Failed to process payment request.`);
    }
  };

  const handleResolveFeedback = async (feedbackId: string, action: "RESOLVE" | "DELETE") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this feedback ticket?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback`, {
        method: action === "DELETE" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update feedback status.");

      if (action === "DELETE") {
        setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
        setMessage("Feedback ticket deleted successfully.");
      } else {
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: "RESOLVED" } : f));
        setMessage("Feedback ticket marked as resolved.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update feedback ticket.");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Dashboard/Overview Item */}
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "dashboard" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "dashboard" ? "#818cf8" : "#9ca3af",
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

          {/* Users Item */}
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "users" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "users" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Users size={16} />
            {!sidebarCollapsed && <span>Users</span>}
          </button>

          {/* API Keys Item */}
          <button
            type="button"
            onClick={() => setActiveTab("keys")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "keys" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "keys" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Key size={16} />
            {!sidebarCollapsed && <span>API Keys</span>}
          </button>

          {/* Plans Item */}
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "plans" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "plans" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Layers size={16} />
            {!sidebarCollapsed && <span>Plans</span>}
          </button>

          {/* Payments Item */}
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "payments" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "payments" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <DollarSign size={16} />
            {!sidebarCollapsed && <span>Payments</span>}
          </button>

          {/* Feedback & Bug Reports Menu */}
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "feedback" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "feedback" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <MessageSquare size={16} />
            {!sidebarCollapsed && <span>Feedbacks / Bugs</span>}
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />

          {/* Go to App Link */}
          <a
            href="/dashboard"
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
            <Sparkles size={16} />
            {!sidebarCollapsed && <span>User Console</span>}
          </a>
        </div>

        {/* Sidebar Collapse Toggle */}
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

      {/* MAIN ADMIN WORKSPACE CONTENT VIEW */}
      <div style={{ flexGrow: 1, padding: "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
        
        {/* Alert Notices */}
        {message && (
          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Check size={16} /> {message}
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* TAB 1: SYSTEM OVERVIEW DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className="app-title" style={{ marginBottom: "2.5rem" }}>
              <div>
                <span className="eyebrow">Admin portal</span>
                <h1 style={{ color: "#fff", margin: "0.25rem 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 850 }}>System Overview</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Manage tenants, websites, subscription credits, and platform-level AI providers.</p>
              </div>
              <div className="metric-row" style={{ marginTop: "1.5rem" }}>
                <div className="stat-tile"><strong>{totalUsers}</strong><span>users</span></div>
                <div className="stat-tile"><strong>{totalSites}</strong><span>websites</span></div>
                <div className="stat-tile"><strong>{totalTenants}</strong><span>tenants</span></div>
                <div className="stat-tile"><strong>{activeSubs}</strong><span>active plans</span></div>
              </div>
            </div>

            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Websites</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Generated Websites</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>All generated projects and publishing status.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Site</th><th>Subdomain</th><th>Status</th><th>Workspace</th></tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const subdomainUrl = `${protocol}://${p.subdomain}.${baseDomain}`;
                      const customDomain = p.customDomain;
                      const customDomainHostname = customDomain?.hostname;
                      const customDomainVerified = customDomain?.verified;
                      const hasCustomDomain = !!customDomainHostname;
                      const customDomainUrl = hasCustomDomain ? `${protocol}://${customDomainHostname}` : null;
                      const projectUrl = p.selfHosted
                        ? null
                        : (hasCustomDomain && customDomainVerified ? customDomainUrl : subdomainUrl);

                      return (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                              {p.selfHosted ? (
                                <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Self-Hosted / External</span>
                              ) : (
                                <>
                                  <a href={projectUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none" }}>
                                    {p.subdomain}.{baseDomain}
                                  </a>
                                  {hasCustomDomain && customDomain && (
                                    <span style={{ fontSize: "0.75rem", color: customDomainVerified ? "#34d399" : "#f87171" }}>
                                      Domain: {customDomainHostname} {customDomainVerified ? "(Verified)" : "(Unverified)"}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td>
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
                          </td>
                          <td>{p.tenant.name}</td>
                        </tr>
                      );
                    })}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No generated websites on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: USERS AND SUBSCRIPTION CREDIT QUOTAS */}
        {activeTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Users</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>User Management</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Workspace ownership and roles across the platform.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Workspace</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><span className="status-pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", fontWeight: 700, background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" }}>{u.role}</span></td>
                        <td>{u.tenant.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Plans</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Subscription Credit Quotas</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Adjust tenant credit limits and subscription attributes without leaving the admin panel.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workspace</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Used</th>
                      <th>Limit</th>
                      <th>AI / LLM</th>
                      <th>Hosting</th>
                      <th>Domain</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.tenant.name}</strong></td>
                        <td style={{ textTransform: "capitalize" }}>{s.planId.replace("-", " ")}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background: s.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: s.status === "ACTIVE" ? "#34d399" : "#f87171"
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td>{s.creditsUsed} credits</td>
                        <td><strong>{s.creditsLimit} credits</strong></td>
                        <td>
                          {s.withLlm ? (
                            <span style={{ color: "#34d399", fontWeight: 600 }}>Enabled</span>
                          ) : (
                            <span style={{ color: "#f87171", fontWeight: 600 }}>Disabled</span>
                          )}
                        </td>
                        <td>
                          {s.hostingType === "OURS" && "Our Hosting"}
                          {s.hostingType === "THEIRS" && "Own Hosting"}
                          {s.hostingType === "BOTH" && "Both"}
                        </td>
                        <td>
                          {s.domainType === "SUBDOMAIN" && "Subdomain Only"}
                          {s.domainType === "CUSTOM" && "Custom Domain"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <PlanEditor
                            tenantId={s.tenantId}
                            initialPlanId={s.planId}
                            initialLimit={s.creditsLimit}
                            initialWithLlm={s.withLlm}
                            initialHostingType={s.hostingType}
                            initialDomainType={s.domainType}
                            initialStatus={s.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: GLOBAL LLM API KEYS */}
        {activeTab === "keys" && (
          <LlmKeyManager
            initialKeys={llmKeys}
            canAddGlobal
            title="Admin LLM API keys"
            description="Add multiple global or user-owned keys for OpenAI, Gemini, Claude, custom providers, and more."
          />
        )}

        {/* TAB 4: SUBSCRIPTION PLANS MAKER */}
        {activeTab === "plans" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Plans Manager</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>
                  {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Configure system plans matching SaaS hosting quotas and platform capacities.</p>
              </div>
              <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PLAN NAME</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g. Pro Premium"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PRICE (INR / MONTH)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>MONTHLY AI CREDITS LIMIT</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={planCredits}
                    onChange={(e) => setPlanCredits(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>FEATURES (COMMA SEPARATED)</label>
                  <textarea
                    className="premium-input"
                    value={planFeatures}
                    onChange={(e) => setPlanFeatures(e.target.value)}
                    placeholder="e.g. 10 Active Sites, Custom Domains, Premium templates"
                    rows={2}
                    style={{ width: "100%", resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  {editingPlanId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(null);
                        setPlanName("");
                        setPlanPrice(299);
                        setPlanCredits(100);
                        setPlanFeatures("");
                      }}
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="primary-action" style={{ background: "linear-gradient(to right, #818cf8, #c084fc)", color: "#fff", border: "none" }}>
                    {editingPlanId ? "Update Plan" : "Create Plan"}
                  </button>
                </div>
              </form>
            </section>

            <section className="surface-panel">
              <div style={{ marginBottom: "1.2rem" }}>
                <span className="eyebrow">Platform Plans</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Configured Platform Plans</h2>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Price (INR)</th>
                      <th>AI Credits</th>
                      <th>Features List</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>₹{p.price}/mo</td>
                        <td>{p.creditsLimit} credits</td>
                        <td>
                          <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                            {p.features || "No features specified"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => startEditPlan(p)}
                              style={{ border: "none", background: "none", color: "#6366f1", cursor: "pointer", padding: "0.2rem" }}
                              title="Edit Plan"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p.id)}
                              style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "0.2rem" }}
                              title="Delete Plan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {plans.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No system plans found. Click create to seed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: UPI GATEWAY SETUP AND PAYMENTS APPROVALS */}
        {activeTab === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel" style={{ height: "fit-content" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Gateway</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>UPI Payment ID Setup</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Configure the platform merchant UPI ID. All user upgrades will generate dynamic payment QR codes using this address.</p>
              </div>
              <form onSubmit={handleSaveUpi} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>MERCHANT UPI ID</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim())}
                    placeholder="e.g. pogakula@ybl"
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <button type="submit" className="primary-action" style={{ background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", width: "100%", justifyContent: "center" }} disabled={loading}>
                  Save UPI Settings
                </button>
              </form>
            </section>

            <section className="surface-panel">
              <div style={{ marginBottom: "1.2rem" }}>
                <span className="eyebrow">Verification</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Incoming Upgrade Payments</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Review incoming user transaction references (UTR codes). Approve verified funds to automatically upgrade tenant accounts.</p>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workspace</th>
                      <th>Requested Plan</th>
                      <th>Amount (INR)</th>
                      <th>UTR / Ref Number</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.tenant.name}</strong></td>
                        <td style={{ textTransform: "capitalize" }}>{r.planId}</td>
                        <td>₹{r.amount}</td>
                        <td><code style={{ color: "#a5b4fc", fontSize: "0.85rem" }}>{r.utr}</code></td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.40rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background:
                                r.status === "APPROVED"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : r.status === "REJECTED"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(245, 158, 11, 0.1)",
                              color:
                                r.status === "APPROVED"
                                  ? "#34d399"
                                  : r.status === "REJECTED"
                                  ? "#f87171"
                                  : "#f59e0b",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {r.status === "PENDING" ? (
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleProcessPayment(r.id, "APPROVE")}
                                className="glow-btn"
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessPayment(r.id, "REJECT")}
                                style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No payment requests submitted.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 6: FEEDBACK & BUG REPORTS MANAGER */}
        {activeTab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Support Tickets</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>User Feedbacks & Bug Reports</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Review bugs, features, and suggestions submitted by users from their workspace dashboards.</p>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Submitter</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Details / Message</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong>{f.userEmail}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Workspace ID: {f.tenantId}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              background: f.type === "BUG" ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
                              color: f.type === "BUG" ? "#f87171" : "#60a5fa",
                              textTransform: "uppercase"
                            }}
                          >
                            {f.type}
                          </span>
                        </td>
                        <td><strong>{f.title}</strong></td>
                        <td style={{ maxWidth: "250px", wordBreak: "break-word" }}>
                          <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{f.message}</span>
                        </td>
                        <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background: f.status === "RESOLVED" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                              color: f.status === "RESOLVED" ? "#34d399" : "#f59e0b"
                            }}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            {f.status === "OPEN" && (
                              <button
                                onClick={() => handleResolveFeedback(f.id, "RESOLVE")}
                                className="glow-btn"
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                disabled={loading}
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => handleResolveFeedback(f.id, "DELETE")}
                              style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              disabled={loading}
                              title="Delete Ticket"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No feedbacks or bug reports submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

    </div>
  );
}
