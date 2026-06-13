import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { getSystemSettings } from "@/lib/settings";
import MarketingHeader from "../components/MarketingHeader";
import { Sparkles, Trophy, Percent, Lock, DollarSign, ArrowRight, HelpCircle } from "lucide-react";

export default async function AffiliatePage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;
  const settings = await getSystemSettings();

  if (settings.affiliateEnabled !== "true") {
    redirect("/");
  }

  // Parse rates
  const t1Max = parseInt(settings.affiliateTier1Max, 10);
  const t2Max = parseInt(settings.affiliateTier2Max, 10);
  const t1Rate = settings.affiliateTier1Rate;
  const t2Rate = settings.affiliateTier2Rate;
  const t3Rate = settings.affiliateTier3Rate;
  const recRate = settings.affiliateRecurringRate;

  return (
    <div className="app-shell" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <MarketingHeader user={user} appName={settings.appName} appLogo={settings.appLogo} />

      <main style={{ maxWidth: "1000px", margin: "4rem auto", padding: "0 2rem", color: "#cbd5e1" }}>
        
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "4rem" }}>
          <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(129, 140, 248, 0.08)", color: "#818cf8", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.8rem", fontWeight: 700 }}>
            <Trophy size={14} /> Partner Program
          </span>
          <h1 style={{ color: "#fff", fontSize: "3rem", fontWeight: 850, marginTop: "1rem", marginBottom: "1.25rem", letterSpacing: "-0.05em", lineHeight: "1.1" }}>
            Earn Up to <span style={{ background: "linear-gradient(to right, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t3Rate}% Commission</span> Promoting {settings.appName}
          </h1>
          <p style={{ maxWidth: "650px", margin: "0 auto", fontSize: "1.1rem", color: "#9ca3af", lineHeight: "1.6" }}>
            Introduce clients and audiences to our prompt-driven AI website builder. Get rewarded with tiered first-purchase payouts and {recRate}% recurring lifetime commissions on yearly plan purchases and renewals. Referred users receive a 20% discount on their initial yearly purchase.
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <a href="/signup" className="primary-action" style={{ background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", padding: "0.75rem 2rem", borderRadius: "0.5rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
              Become an Affiliate <ArrowRight size={16} />
            </a>
            <a href="#tiers" className="secondary-action" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", display: "inline-block", fontWeight: 600 }}>
              View Commission Tiers
            </a>
          </div>
        </section>

        {/* Lock Notice Panel */}
        <section className="glass-panel" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(245, 158, 11, 0.2)", background: "rgba(245, 158, 11, 0.02)", marginBottom: "4rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", width: "48px", height: "48px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Exclusive Partner Program</h3>
            <p style={{ margin: "0.25rem 0 0 0", color: "#9ca3af", fontSize: "0.9rem", lineHeight: "1.5" }}>
              To ensure top-quality partnerships, <strong>only paid subscribers</strong> (Pro or Agency plan) can participate in our Affiliate Program. Upgrade or purchase a subscription to automatically activate your partner link inside your dashboard.
            </p>
          </div>
        </section>

        {/* Commission Tiers Table */}
        <section id="tiers" style={{ marginBottom: "4rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <span className="eyebrow" style={{ color: "#c084fc" }}>Tiers</span>
            <h2 style={{ color: "#fff", margin: "0.25rem 0 0 0", fontSize: "1.75rem", fontWeight: 800 }}>Affiliate Payout Scale</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Commission increases automatically as you refer more customers.</p>
          </div>

          <div className="table-wrap" style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "#fff", fontWeight: 700 }}>Active Referrals Tier</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#fff", fontWeight: 700 }}>First-Purchase Commission</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#fff", fontWeight: 700 }}>Renewal Commission</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <strong style={{ color: "#fff" }}>1 - {t1Max} Referrals</strong>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", color: "#818cf8", fontWeight: 700 }}>{t1Rate}%</td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>{recRate}% recurring</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <strong style={{ color: "#fff" }}>{t1Max + 1} - {t2Max} Referrals</strong>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", color: "#a78bfa", fontWeight: 700 }}>{t2Rate}%</td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>{recRate}% recurring</td>
                </tr>
                <tr>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <strong style={{ color: "#fff" }}>{t2Max + 1}+ Referrals</strong>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", color: "#c084fc", fontWeight: 700 }}>{t3Rate}%</td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>{recRate}% recurring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Highlights */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "4rem" }}>
          <div className="surface-panel" style={{ padding: "2rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
            <span className="icon-box" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", width: "40px", height: "40px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}><Percent size={20} /></span>
            <h3 style={{ color: "#fff", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>High Conversion Rates</h3>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Our AI site generator designs premium landing pages, portfolios, and storefronts in under 60 seconds. High product utility translates to higher conversions on your referrals.
            </p>
          </div>
          <div className="surface-panel" style={{ padding: "2rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
            <span className="icon-box" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", width: "40px", height: "40px", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}><DollarSign size={20} /></span>
            <h3 style={{ color: "#fff", margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>Lifetime Recurring Commissions</h3>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Every time a customer you referred renews their subscription (Pro or Agency, annual cycles only), you receive a {recRate}% recurring payout. Build a steady stream of passive income.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "4rem", marginBottom: "2rem" }}>
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <span className="eyebrow" style={{ color: "#818cf8" }}>FAQ</span>
            <h2 style={{ color: "#fff", margin: "0.25rem 0 0 0", fontSize: "2rem", fontWeight: 800 }}>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 0.5rem 0" }}>
                <HelpCircle size={16} style={{ color: "#818cf8" }} /> Who qualifies as a paid subscriber?
              </h3>
              <p style={{ margin: 0, paddingLeft: "1.5rem", color: "#9ca3af", fontSize: "0.95rem", lineHeight: "1.5" }}>
                Any account with an active Pro or Agency subscription plan. Free-tier/starter accounts do not qualify for referral code links. If your subscription lapses, referral links are temporarily locked.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 0.5rem 0" }}>
                <HelpCircle size={16} style={{ color: "#818cf8" }} /> How do I get my affiliate code?
              </h3>
              <p style={{ margin: 0, paddingLeft: "1.5rem", color: "#9ca3af", fontSize: "0.95rem", lineHeight: "1.5" }}>
                Once you subscribe to a paid plan, log in, navigate to **Dashboard &gt; Affiliate Program** inside your sidebar. Your unique referral link and real-time conversion stats will be displayed automatically.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 0.5rem 0" }}>
                <HelpCircle size={16} style={{ color: "#818cf8" }} /> What is the referee discount?
              </h3>
              <p style={{ margin: 0, paddingLeft: "1.5rem", color: "#9ca3af", fontSize: "0.95rem", lineHeight: "1.5" }}>
                Referred users who sign up and purchase an annual plan using your code will receive a <strong>20% discount</strong> on their first year's checkout total.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 0.5rem 0" }}>
                <HelpCircle size={16} style={{ color: "#818cf8" }} /> Are monthly plans included?
              </h3>
              <p style={{ margin: 0, paddingLeft: "1.5rem", color: "#9ca3af", fontSize: "0.95rem", lineHeight: "1.5" }}>
                No, the partner referral program is strictly valid for yearly plans. Monthly plans are excluded from referral discounts and commission rewards.
              </p>
            </div>
            <div>
              <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, display: "flex", gap: "0.5rem", alignItems: "center", margin: "0 0 0.5rem 0" }}>
                <HelpCircle size={16} style={{ color: "#818cf8" }} /> What is the mature commission holding period?
              </h3>
              <p style={{ margin: 0, paddingLeft: "1.5rem", color: "#9ca3af", fontSize: "0.95rem", lineHeight: "1.5" }}>
                Commissions mature and become eligible for payout <strong>10 days</strong> after a referred user completes their billing. This matches our customer refund policy window. If a customer cancels and requests a refund, the corresponding pending commission is cancelled.
              </p>
            </div>
          </div>
        </section>

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
