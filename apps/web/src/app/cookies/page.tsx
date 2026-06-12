import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export default function CookiesPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  return (
    <div className="app-shell" style={{ background: "#0a0e17", minHeight: "100vh" }}>
      <MarketingHeader user={user} />
      
      <main style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 2rem", color: "#cbd5e1", lineHeight: "1.7" }}>
        <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: 850, marginBottom: "1rem" }}>Cookies Policy</h1>
        <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "2rem" }}>Last Updated: June 2, 2026</p>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your computer or mobile device when you visit a website. They help us remember your preferences, keep you logged in, and verify referral codes.
          </p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>2. How We Use Cookies</h2>
          <p>
            Webbing uses cookies for the following essential purposes:
          </p>
          <ul style={{ margin: "0.5rem 0 0 1rem", paddingLeft: "1rem" }}>
            <li><strong>Authentication:</strong> We use secure cookies to verify your identity and maintain your login sessions (`webbing-session`).</li>
            <li><strong>Affiliate Tracking:</strong> We use cookies or local storage to temporarily cache partner referral codes when someone visits a referral link, ensuring they receive their 10% discount during signup or plan checkout.</li>
            <li><strong>Preferences:</strong> We store local theme options, panel toggles, and sidebar preferences.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>3. Managing Cookies</h2>
          <p>
            Most browsers allow you to block or delete cookies in their settings. However, blocking essential session cookies will prevent you from logging into your Webbing dashboard or using the visual editor features.
          </p>
        </section>
      </main>

      <footer className="footer" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", marginTop: "auto" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.5rem" }}>
          <a href="/terms" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Terms & Conditions</a>
          <a href="/privacy" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Privacy Policy</a>
          <a href="/cookies" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Cookies Policy</a>
          <a href="/refund" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Refund Policy</a>
        </div>
        <div style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.8rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          <span>© {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved.</span>
          <span style={{ opacity: 0.6 }}>Version v0.9.0</span>
        </div>
      </footer>
    </div>
  );
}
