"use client";

import React, { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";

interface MarketingHeaderProps {
  active?: "signin" | "signup";
  user?: { email: string; role: string } | null;
  appName?: string;
  appLogo?: string;
}

export default function MarketingHeader({ active, user, appName: propAppName, appLogo: propAppLogo }: MarketingHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientSettings, setClientSettings] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) {
        localStorage.setItem("webbing_referrer", ref);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!propAppName) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.settings) {
            setClientSettings(data.settings);
          }
        })
        .catch((err) => console.error("Error loading header branding settings:", err));
    }
  }, [propAppName]);

  const appName = propAppName || clientSettings?.appName || "Webbing";
  const appLogo = propAppLogo || clientSettings?.appLogo || "";

  return (
    <header className="site-nav" style={{ position: "relative" }}>
      <div className="brand-wrapper">
        <a className="brand" href="/">
          {appLogo ? (
            <img src={appLogo} alt={appName} style={{ height: "24px", maxWidth: "100px", objectFit: "contain", marginRight: "0.25rem" }} />
          ) : (
            <span className="brand-mark"><Sparkles size={18} /></span>
          )}
          {appName}
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
