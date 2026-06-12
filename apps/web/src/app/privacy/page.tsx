import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getSystemSettings } from "@/lib/settings";

export default async function PrivacyPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;
  const settings = await getSystemSettings();

  return (
    <div className="app-shell" style={{ background: "#0a0e17", minHeight: "100vh" }}>
      <MarketingHeader user={user} appName={settings.appName} appLogo={settings.appLogo} />
      
      <main style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 2rem", color: "#cbd5e1", lineHeight: "1.7" }}>
        <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: 850, marginBottom: "1rem" }}>Privacy Policy</h1>
        
        {settings.policyPrivacy ? (
          <div style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
            {settings.policyPrivacy}
          </div>
        ) : (
          <>
            <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "2rem" }}>Last Updated: June 2, 2026</p>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as your name, email, credentials, billing information, and custom domain names. We also collect website usage metadata, API logs, and visitor contact form submissions processed on your generated websites.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>2. How We Use Information</h2>
              <p>
                We use your data to operate, configure, and maintain your website workspaces, process subscription payments, process affiliate program discounts and payouts, and route LLM generations. 
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>3. Data Sharing & Integrations</h2>
              <p>
                To support prompt-driven website builders and visual editors, we share layout descriptions and text prompts with third-party Large Language Model providers (like OpenAI, Google Gemini, Anthropic Claude) based on your configured provider settings. We do not sell your personal or visitor data to third parties.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>4. Cookies & Trackers</h2>
              <p>
                We use secure cookies to authenticate your account session and track cached affiliate referral codes to apply discounts. For detailed information, please read our Cookies Policy.
              </p>
            </section>
          </>
        )}
      </main>

      <footer className="footer" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", marginTop: "auto" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.5rem" }}>
          <a href="/terms" className="footer-link">Terms & Conditions</a>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <a href="/cookies" className="footer-link">Cookies Policy</a>
          <a href="/refund" className="footer-link">Refund Policy</a>
          {settings.affiliateEnabled === "true" && (
            <a href="/affiliate" className="footer-link">Affiliate Program</a>
          )}
        </div>
        <div style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.8rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          <span>© {new Date().getFullYear()} {settings.appName} Platforms Inc. All rights reserved.</span>
          <span style={{ opacity: 0.6 }}>Version v0.9.0</span>
        </div>
      </footer>
    </div>
  );
}
