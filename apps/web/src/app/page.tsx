import React from "react";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import GeneratorForm from "./GeneratorForm";
import { Sparkles, Check, Zap, Shield, ArrowRight, Globe, Layers, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top left, #0d1224, #030712)", position: "relative", overflow: "hidden" }}>
      
      {/* Visual background decorations (Glow Orbs) */}
      <div className="animate-pulse-slow" style={{ position: "absolute", width: "400px", height: "400px", background: "rgba(99, 102, 241, 0.15)", borderRadius: "50%", filter: "blur(100px)", top: "-100px", left: "-50px", pointerEvents: "none" }} />
      <div className="animate-pulse-slow" style={{ position: "absolute", width: "500px", height: "500px", background: "rgba(217, 70, 239, 0.12)", borderRadius: "50%", filter: "blur(120px)", bottom: "100px", right: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "350px", height: "350px", background: "rgba(6, 182, 212, 0.08)", borderRadius: "50%", filter: "blur(90px)", top: "40%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />

      {/* Header Navigation */}
      <header className="glass-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 4rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ background: "linear-gradient(135deg, #6366f1, #d946ef)", padding: "0.4rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>
            Webbing
          </span>
        </div>

        <nav style={{ display: "flex", gap: "2.5rem", fontSize: "0.95rem", fontWeight: 600, color: "#9ca3af" }}>
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
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
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
                  padding: "0.6rem 1.25rem", 
                  borderRadius: "0.6rem", 
                  fontWeight: 600,
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
                  padding: "0.6rem 1.25rem", 
                  borderRadius: "0.6rem", 
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Sign In
              </a>
              <a 
                href="/signup" 
                className="glow-btn"
                style={{ 
                  background: "linear-gradient(to right, #4f46e5, #06b6d4)", 
                  color: "#ffffff", 
                  padding: "0.6rem 1.5rem", 
                  borderRadius: "0.6rem", 
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)" 
                }}
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flexGrow: 1, padding: "6rem 2rem", maxWidth: "1200px", margin: "0 auto", textAlign: "center", width: "100%", position: "relative", zIndex: 10 }}>
        
        <div style={{ marginBottom: "2rem" }}>
          <span style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "0.45rem 1.2rem", borderRadius: "2rem", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Zap size={14} fill="#818cf8" /> NEXT-GEN SAAS FOR CREATORS
          </span>
        </div>

        <h1 style={{ fontSize: "4rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 1.5rem 0", lineHeight: 1.15, background: "linear-gradient(to bottom, #ffffff 60%, #9ca3af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Build production websites<br />with AI in 60 seconds
        </h1>

        <p style={{ fontSize: "1.25rem", color: "#9ca3af", maxWidth: "720px", margin: "0 auto 4rem auto", lineHeight: 1.7, fontWeight: 400 }}>
          Describe your business, layout preferences, and style. Our orchestrator structures dynamic copy, assets, components, and publishes instantly to subdomains or custom domains.
        </p>

        {/* Prompt Input Form */}
        <div style={{ marginBottom: "7rem" }}>
          <GeneratorForm user={user} />
        </div>

        {/* Features Specs Section */}
        <section id="features" style={{ padding: "3rem 0 6rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", marginBottom: "3rem" }}>Orchestrated SaaS Features</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", textAlign: "left" }}>
            
            <div className="glass-card" style={{ padding: "2rem", borderRadius: "1rem" }}>
              <div style={{ background: "rgba(99, 102, 241, 0.1)", width: "45px", height: "45px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyValue: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Sparkles size={22} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#ffffff" }}>AI Copywriting</h3>
              <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>Generates professional headlines, product summaries, features, and marketing layout copy in seconds.</p>
            </div>

            <div className="glass-card" style={{ padding: "2rem", borderRadius: "1rem" }}>
              <div style={{ background: "rgba(6, 182, 212, 0.1)", width: "45px", height: "45px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Globe size={22} color="#22d3ee" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Subdomains & Custom SSL</h3>
              <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>Every project gets a free subdomain instantly. Pro plans connect custom domains with automatic SSL certificate creation.</p>
            </div>

            <div className="glass-card" style={{ padding: "2rem", borderRadius: "1rem" }}>
              <div style={{ background: "rgba(236, 72, 153, 0.1)", width: "45px", height: "45px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                <Layers size={22} color="#f472b6" />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#ffffff" }}>Component Library</h3>
              <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>A wide library of styled layout templates, hero blocks, features, contact sheets, and shop widgets built with Tailwind config.</p>
            </div>

          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section id="pricing" style={{ padding: "5rem 0", borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0", letterSpacing: "-0.02em" }}>Select Your Plan</h2>
          <p style={{ color: "#9ca3af", marginBottom: "4rem", fontSize: "1.05rem" }}>Scale your AI credit tokens and host unlimited generated projects.</p>
          
          <div className="pricing-grid">
            
            {/* Free Tier */}
            <div className="glass-card" style={{ padding: "3rem 2.25rem", borderRadius: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", position: "relative" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", background: "rgba(255, 255, 255, 0.05)", padding: "0.25rem 0.75rem", borderRadius: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Starter</span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.5rem 0 0 0", color: "#ffffff" }}>Free</h3>
                <div style={{ fontSize: "3rem", fontWeight: 800, margin: "1.5rem 0", color: "#ffffff" }}>$0 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>/ month</span></div>
                
                <hr style={{ border: 0, borderTop: "1px solid rgba(255, 255, 255, 0.06)", margin: "1.5rem 0" }} />
                
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem 0", fontSize: "0.95rem", color: "#9ca3af", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> 1 Active generated project</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> 5 AI generation credits</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> subdomain.webbing.in hosting</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: 0.4, textDecoration: "line-through" }}><CheckCircle2 size={18} /> Custom domain connection</li>
                </ul>
              </div>
              <a href="/signup" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.85rem", borderRadius: "0.75rem", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#f3f4f6", fontWeight: 700, textAlign: "center", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}>
                Start Free
              </a>
            </div>

            {/* Pro Tier (Recommended) */}
            <div className="glass-card" style={{ padding: "3rem 2.25rem", borderRadius: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", position: "relative", border: "1px solid rgba(99, 102, 241, 0.5)", background: "rgba(99, 102, 241, 0.03)", boxShadow: "0 10px 30px rgba(99, 102, 241, 0.15)" }}>
              <div style={{ position: "absolute", top: "-14px", right: "24px", background: "linear-gradient(to right, #6366f1, #ec4899)", color: "#ffffff", padding: "0.3rem 1rem", borderRadius: "2rem", fontSize: "0.75rem", fontWeight: 800, boxShadow: "0 4px 10px rgba(99, 102, 241, 0.4)", letterSpacing: "0.03em" }}>MOST POPULAR</div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", background: "rgba(99, 102, 241, 0.15)", padding: "0.25rem 0.75rem", borderRadius: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Growth</span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.5rem 0 0 0", color: "#ffffff" }}>Pro</h3>
                <div style={{ fontSize: "3rem", fontWeight: 800, margin: "1.5rem 0", color: "#ffffff" }}>$29 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>/ month</span></div>
                
                <hr style={{ border: 0, borderTop: "1px solid rgba(99, 102, 241, 0.15)", margin: "1.5rem 0" }} />
                
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem 0", fontSize: "0.95rem", color: "#f3f4f6", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#c084fc" /> 10 Active generated projects</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#c084fc" /> 100 AI generation credits / mo</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#c084fc" /> Custom domain mapping</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#c084fc" /> Automatic Let's Encrypt SSL</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#c084fc" /> E-commerce shopping cart</li>
                </ul>
              </div>
              <a href="/signup" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.85rem", borderRadius: "0.75rem", background: "linear-gradient(to right, #6366f1, #d946ef)", color: "#ffffff", fontWeight: 700, textAlign: "center", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)" }}>
                Get Pro Access
              </a>
            </div>

            {/* Agency Tier */}
            <div className="glass-card" style={{ padding: "3rem 2.25rem", borderRadius: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", position: "relative" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", background: "rgba(255, 255, 255, 0.05)", padding: "0.25rem 0.75rem", borderRadius: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enterprise</span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.5rem 0 0 0", color: "#ffffff" }}>Agency</h3>
                <div style={{ fontSize: "3rem", fontWeight: 800, margin: "1.5rem 0", color: "#ffffff" }}>$99 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>/ month</span></div>
                
                <hr style={{ border: 0, borderTop: "1px solid rgba(255, 255, 255, 0.06)", margin: "1.5rem 0" }} />
                
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem 0", fontSize: "0.95rem", color: "#9ca3af", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> Unlimited generated projects</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> 500 AI generation credits / mo</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> Custom domain map & export</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> White-label client dashboard</li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><CheckCircle2 size={18} color="#10b981" /> Priority ticket support</li>
                </ul>
              </div>
              <a href="/signup" className="glow-btn" style={{ display: "block", width: "100%", padding: "0.85rem", borderRadius: "0.75rem", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#f3f4f6", fontWeight: 700, textAlign: "center", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}>
                Get Agency
              </a>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}>
        © {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved. Custom-built multi-tenant SaaS.
      </footer>
    </div>
  );
}
