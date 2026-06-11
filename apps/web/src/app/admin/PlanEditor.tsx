"use client";

import React, { useState } from "react";
import { Settings, Check } from "lucide-react";

interface PlanEditorProps {
  tenantId: string;
  initialPlanId: string;
  initialLimit: number;
  initialWithLlm: boolean;
  initialHostingType: string;
  initialDomainType: string;
  initialStatus: string;
}

export default function PlanEditor({
  tenantId,
  initialPlanId,
  initialLimit,
  initialWithLlm,
  initialHostingType,
  initialDomainType,
  initialStatus,
}: PlanEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [planId, setPlanId] = useState(initialPlanId);
  const [limit, setLimit] = useState(initialLimit);
  const [withLlm, setWithLlm] = useState(initialWithLlm);
  const [hostingType, setHostingType] = useState(initialHostingType);
  const [domainType, setDomainType] = useState(initialDomainType);
  const [status, setStatus] = useState(initialStatus);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          planId,
          status,
          creditsLimit: limit,
          withLlm,
          hostingType,
          domainType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update configuration.");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        // Reload to show the updated settings on the table
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
          background: "rgba(99, 102, 241, 0.15)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
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
        <Settings size={13} />
        Configure
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
              <span className="eyebrow">Admin Action</span>
              <h3 style={{ margin: 0, fontSize: "1.35rem", color: "#ffffff", fontWeight: 800 }}>
                Configure Plan Settings
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

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Plan Type Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  SUBSCRIPTION PLAN
                </label>
                <select
                  className="premium-input"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                  disabled={loading}
                >
                  <option value="free-plan">Free Plan</option>
                  <option value="pro-plan">Pro Plan</option>
                  <option value="agency-plan">Agency Plan</option>
                </select>
              </div>

              {/* Quota Credit Limit Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  MONTHLY CREDIT QUOTA
                </label>
                <input
                  type="number"
                  className="premium-input"
                  value={limit}
                  onChange={(e) => setLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  required
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>

              {/* LLM & Status Configuration Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                    STATUS
                  </label>
                  <select
                    className="premium-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                    disabled={loading}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAST_DUE">Past Due</option>
                    <option value="CANCELED">Canceled</option>
                    <option value="UNPAID">Unpaid</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", justifyContent: "center" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                    FEATURES
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#ffffff", cursor: "pointer", fontWeight: 600, userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={withLlm}
                      onChange={(e) => setWithLlm(e.target.checked)}
                      disabled={loading}
                      style={{ accentColor: "#6366f1", width: "17px", height: "17px" }}
                    />
                    Enable AI / LLM
                  </label>
                </div>
              </div>

              {/* Hosting Configuration */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  HOSTING OPTIONS
                </label>
                <select
                  className="premium-input"
                  value={hostingType}
                  onChange={(e) => setHostingType(e.target.value)}
                  style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                  disabled={loading}
                >
                  <option value="OURS">Host on our server (SaaS Shared)</option>
                  <option value="THEIRS">Host on customer's own server</option>
                  <option value="BOTH">Enable both hosting options</option>
                </select>
              </div>

              {/* Domain Configuration */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  DOMAIN PRIVILEGES
                </label>
                <select
                  className="premium-input"
                  value={domainType}
                  onChange={(e) => setDomainType(e.target.value)}
                  style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                  disabled={loading}
                >
                  <option value="SUBDOMAIN">Subdomain only (e.g. brand.webbing.in)</option>
                  <option value="CUSTOM">Custom Domain connection (e.g. brand.com)</option>
                </select>
              </div>

              {/* Action Buttons */}
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
                  {loading ? "Saving..." : "Save Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
