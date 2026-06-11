"use client";

import React, { useState } from "react";
import { Edit2, Check } from "lucide-react";

interface UserEditorProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialRole: string;
}

export default function UserEditor({
  userId,
  initialName,
  initialEmail,
  initialRole,
}: UserEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password && password.length < 6) {
      setError("New password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          email,
          role,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user details.");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setPassword("");
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
        style={{
          background: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          color: "#a5b4fc",
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
        Edit User
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
              maxWidth: "480px",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              position: "relative",
              textAlign: "left",
              background: "#0d111c",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="eyebrow">Admin Action</span>
              <h3 style={{ margin: 0, fontSize: "1.35rem", color: "#ffffff", fontWeight: 800 }}>
                Edit User details
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
                <Check size={16} /> Saved user details successfully!
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  className="premium-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Email Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  className="premium-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@domain.com"
                  required
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Role Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  PLATFORM ROLE
                </label>
                <select
                  className="premium-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ background: "#0d111c", color: "#ffffff", width: "100%" }}
                  disabled={loading}
                >
                  <option value="USER">User (Standard)</option>
                  <option value="ADMIN">Admin (Superuser)</option>
                </select>
              </div>

              {/* New Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.05em" }}>
                  PASSWORD (LEAVE BLANK TO UNCHANGE)
                </label>
                <input
                  type="password"
                  className="premium-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set secure new password"
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setName(initialName);
                    setEmail(initialEmail);
                    setRole(initialRole);
                    setPassword("");
                  }}
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
                  {loading ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
