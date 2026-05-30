"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Shield, Plus, Trash2, Edit2, Sparkles, DollarSign, Layers } from "lucide-react";

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

interface AdminConsoleProps {
  initialPlans: Plan[];
  initialRequests: PaymentRequest[];
  initialUpiId: string;
}

export default function AdminConsole({
  initialPlans,
  initialRequests,
  initialUpiId,
}: AdminConsoleProps) {
  // States
  const [upiId, setUpiId] = useState(initialUpiId);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2rem" }}>
      {/* Alert Notices */}
      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Check size={16} /> {message}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Grid: UPI ID and Plan Creation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem" }}>
        
        {/* UPI Configuration Form */}
        <section className="surface-panel" style={{ height: "fit-content" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span className="eyebrow">Gateway</span>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>UPI Payment ID Setup</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Configure the platform merchant UPI ID. All user upgrades will generate dynamic payment QR codes using this address.</p>
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

        {/* Add/Edit Plan Form */}
        <section className="surface-panel">
          <div style={{ marginBottom: "1.5rem" }}>
            <span className="eyebrow">Plans Manager</span>
            <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>
              {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Configure system plans matching SaaS hosting quotas and platform capacities.</p>
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
      </div>

      {/* Plan list table */}
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

      {/* UPI Payment Requests section */}
      <section className="surface-panel">
        <div style={{ marginBottom: "1.2rem" }}>
          <span className="eyebrow">Verification</span>
          <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Incoming Upgrade Payments</h2>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Review incoming user transaction references (UTR codes). Approve verified funds to automatically upgrade tenant accounts.</p>
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
  );
}
