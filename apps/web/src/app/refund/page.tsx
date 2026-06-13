import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { getSystemSettings } from "@/lib/settings";

export default async function RefundPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;
  const settings = await getSystemSettings();

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <MarketingHeader user={user} appName={settings.appName} appLogo={settings.appLogo} />
      
      <main style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 2rem", color: "#cbd5e1", lineHeight: "1.7" }}>
        <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: 850, marginBottom: "1rem" }}>Refund & Cancellation Policy</h1>
        
        {settings.policyRefund ? (
          <div style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
            {settings.policyRefund}
          </div>
        ) : (
          <>
            <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "2rem" }}>Last Updated: June 2, 2026</p>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>1. 10-Day Cancellation Window</h2>
              <p>
                We want you to be completely satisfied with Webbing. If you decide to cancel a paid subscription (Pro or Agency plan) within <strong>10 days</strong> of your purchase or upgrade, you are eligible for a credit-deducted refund.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>2. Credit-Deducted Refund Calculation</h2>
              <p>
                To prevent abuse of AI text and image generations, we deduct the value of used AI credits from the refund amount. The refund is calculated as:
              </p>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.5rem", padding: "1rem", margin: "1rem 0", fontFamily: "monospace", color: "#818cf8" }}>
                Refund Amount = Original Plan Price - (Credits Used * Cost Per Credit)
              </div>
              <p>
                The Cost Per Credit is computed as the total plan price divided by its monthly credit limit (e.g. for a ₹599 plan with 30 credits, each credit is valued at ₹20). If the credits-used deduction exceeds the plan price, no refund will be issued.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>3. Invalidation of Referrals</h2>
              <p>
                If a plan is cancelled and refunded, any pending affiliate commissions credited to your referrer for this purchase will be immediately and permanently cancelled.
              </p>
            </section>

            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "1.5rem 0 0.5rem 0" }}>4. How to Request a Refund</h2>
              <p>
                To request a refund, go to your <strong>Dashboard &gt; Upgrade Plan</strong>, find your active plan status tile, and click the <strong>Cancel & Refund</strong> button. Our system will quote your credit-deducted refund amount and submit the cancellation request to our billing team. Approved refunds are credited back to your original source of payment within 5-7 business days.
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
          <span style={{ opacity: 0.6 }}>Version V1.0</span>
        </div>
      </footer>
    </div>
  );
}
