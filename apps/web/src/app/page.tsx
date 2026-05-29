import React from "react";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import GeneratorForm from "./GeneratorForm";

export default function LandingPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top left, #111827, #030712)" }}>
      {/* Header Navigation */}
      <header className="glass-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 3rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "bold", background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>Webbing</span>
        </div>
        <nav style={{ display: "flex", gap: "2rem", fontSize: "0.95rem", fontWeight: 500, color: "#9ca3af" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          {user && (
            <>
              <a href="/dashboard" className="nav-link" style={{ color: "#818cf8" }}>Dashboard</a>
              {user.role === "ADMIN" && (
                <a href="/admin" className="nav-link" style={{ color: "#ec4899" }}>Admin Panel</a>
              )}
            </>
          )}
        </nav>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {user ? (
            <>
              <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Logged in as <strong style={{ color: "#f3f4f6" }}>{user.email}</strong>
              </span>
              <a 
                href="/api/auth/signout" 
                className="glow-btn"
                style={{ 
                  background: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.2)", 
                  color: "#f87171", 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  fontWeight: 500,
                  fontSize: "0.85rem"
                }}
              >
                Sign Out
              </a>
            </>
          ) : (
            <>
              <a 
                href="/signin" 
                style={{ 
                  background: "transparent", 
                  border: "1px solid rgba(255, 255, 255, 0.1)", 
                  color: "#f3f4f6", 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  fontWeight: 500,
                  fontSize: "0.85rem"
                }}
              >
                Sign In
              </a>
              <a 
                href="/signin" 
                className="glow-btn"
                style={{ 
                  background: "linear-gradient(to right, #4f46e5, #06b6d4)", 
                  color: "#ffffff", 
                  padding: "0.5rem 1.25rem", 
                  borderRadius: "0.5rem", 
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)" 
                }}
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flexGrow: 1, padding: "5rem 2rem", maxWidth: "1200px", margin: "0 auto", textAlign: "center", width: "100%" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "0.35rem 1rem", borderRadius: "2rem", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em" }}>AI-POWERED WEBSITE BUILDER</span>
        </div>
        <h1 style={{ fontSize: "3.5rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 1.5rem 0", lineHeight: 1.1, background: "linear-gradient(to bottom, #ffffff 60%, #9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Build production websites<br />with AI in 60 seconds
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#9ca3af", maxWidth: "700px", margin: "0 auto 3rem auto", lineHeight: 1.6 }}>
          Describe your business, style, and layout preferences. Our AI orchestration pipeline builds copies, themes, layouts, and publishes instantly on your custom domain.
        </p>

        {/* Prompt Input Form (Main Feature Component) */}
        <div style={{ marginBottom: "6rem" }}>
          <GeneratorForm user={user} />
        </div>

        {/* Pricing Tiers Section */}
        <section id="pricing" style={{ padding: "5rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Select Your Plan</h2>
          <p style={{ color: "#9ca3af", marginBottom: "4rem" }}>Scale your AI credit tokens and host unlimited generated projects.</p>
          
          <div className="pricing-grid">
            {/* Free Tier */}
            <div className="glass-card" style={{ padding: "2.5rem 2rem", borderRadius: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Free</h3>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "1rem 0" }}>$0 <span style={{ fontSize: "0.95rem", color: "#9ca3af", fontWeight: 400 }}>/ mo</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "2rem 0", textAlign: "left", fontSize: "0.9rem", color: "#9ca3af", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <li>✓ 1 Active generated project</li>
                  <li>✓ Capped at 5 AI generation credits</li>
                  <li>✓ webbing.in/subdomain hosting</li>
                  <li style={{ textDecoration: "line-through", opacity: 0.5 }}>✗ Custom domain connection</li>
                </ul>
              </div>
              <a href="/signin" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f3f4f6", fontWeight: 600, textAlign: "center" }}>Start Free</a>
            </div>

            {/* Pro Tier (Recommended) */}
            <div className="glass-card" style={{ padding: "2.5rem 2rem", borderRadius: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center", position: "relative", border: "1px solid rgba(99, 102, 241, 0.3)", background: "rgba(99, 102, 241, 0.03)" }}>
              <div style={{ position: "absolute", top: "-12px", right: "20px", background: "linear-gradient(to right, #6366f1, #ec4899)", color: "#ffffff", padding: "0.25rem 0.75rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 700 }}>MOST POPULAR</div>
              <div>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", color: "#818cf8" }}>Pro</h3>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "1rem 0" }}>$29 <span style={{ fontSize: "0.95rem", color: "#9ca3af", fontWeight: 400 }}>/ mo</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "2rem 0", textAlign: "left", fontSize: "0.9rem", color: "#f3f4f6", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <li>✓ 10 Active generated projects</li>
                  <li>✓ 100 AI generation credits / month</li>
                  <li>✓ Custom domain mapping</li>
                  <li>✓ Automatic dynamic Let's Encrypt SSL</li>
                  <li>✓ Basic e-commerce shopping cart</li>
                </ul>
              </div>
              <a href="/signin" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "linear-gradient(to right, #4f46e5, #06b6d4)", color: "#ffffff", fontWeight: 600, textAlign: "center", boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)" }}>Get Pro</a>
            </div>

            {/* Agency Tier */}
            <div className="glass-card" style={{ padding: "2.5rem 2rem", borderRadius: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", color: "#9ca3af" }}>Agency</h3>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, margin: "1rem 0" }}>$99 <span style={{ fontSize: "0.95rem", color: "#9ca3af", fontWeight: 400 }}>/ mo</span></div>
                <ul style={{ listStyle: "none", padding: 0, margin: "2rem 0", textAlign: "left", fontSize: "0.9rem", color: "#9ca3af", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <li>✓ Unlimited generated projects</li>
                  <li>✓ 500 AI generation credits / month</li>
                  <li>✓ Custom domain mapping & export</li>
                  <li>✓ White-label client dashboard</li>
                  <li>✓ Priority ticket support</li>
                </ul>
              </div>
              <a href="/signin" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f3f4f6", fontWeight: 600, textAlign: "center" }}>Get Agency</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem", textAlign: "center", color: "#4b5563", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        © {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved. Custom-built multi-tenant SaaS.
      </footer>
    </div>
  );
}
