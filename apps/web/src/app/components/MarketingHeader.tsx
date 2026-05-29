"use client";

import React, { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";

interface MarketingHeaderProps {
  active?: "signin" | "signup";
  user?: { email: string; role: string } | null;
}

export default function MarketingHeader({ active, user }: MarketingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="site-nav" style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <a className="brand" href="/">
          <span className="brand-mark"><Sparkles size={18} /></span>
          Webbing
        </a>
        
        {/* Mobile menu toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            display: "none",
            alignItems: "center",
            padding: "0.5rem",
          }}
          className="mobile-menu-toggle"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Nav Menu Links and Actions */}
      <div className={`nav-menu-container ${isOpen ? "open" : ""}`}>
        <nav className="nav-links">
          <a href="/#home" onClick={() => setIsOpen(false)}>Home</a>
          <a href="/#features" onClick={() => setIsOpen(false)}>Features</a>
          <a href="/#pricing" onClick={() => setIsOpen(false)}>Pricing</a>
          <a href="/#about" onClick={() => setIsOpen(false)}>About us</a>
          <a href="/#contact" onClick={() => setIsOpen(false)}>Contact us</a>
          {user && (
            <>
              <a href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</a>
              {user.role === "ADMIN" && <a href="/admin" onClick={() => setIsOpen(false)}>Admin</a>}
            </>
          )}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
              <a className="danger-action" href="/api/auth/signout">Sign out</a>
            </>
          ) : (
            <>
              <a className={active === "signin" ? "primary-action" : "secondary-action"} href="/signin">Sign in</a>
              <a className={active === "signup" ? "primary-action" : "secondary-action"} href="/signup">Sign up</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
