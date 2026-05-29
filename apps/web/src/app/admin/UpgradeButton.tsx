"use client";

import React, { useState } from "react";

interface UpgradeButtonProps {
  tenantId: string;
  initialLimit: number;
}

export default function UpgradeButton({ tenantId, initialLimit }: UpgradeButtonProps) {
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const res = await fetch("/api/admin/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upgrade subscription");
      }

      setLimit(data.newLimit);
    } catch (err: any) {
      alert(err.message || "An error occurred while upgrading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#10b981" }}>{limit} limit</span>
      <button 
        onClick={handleUpgrade}
        disabled={loading}
        className="glow-btn"
        style={{ 
          background: "linear-gradient(to right, #10b981, #059669)", 
          border: "none", 
          color: "#ffffff", 
          padding: "0.35rem 0.75rem", 
          borderRadius: "0.35rem", 
          fontSize: "0.75rem", 
          fontWeight: 700, 
          cursor: loading ? "not-allowed" : "pointer" 
        }}
      >
        {loading ? "Upgrading..." : "+100 Credits"}
      </button>
    </div>
  );
}
