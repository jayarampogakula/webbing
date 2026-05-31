"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  const plans = [
    {
      id: "starter",
      name: "Free",
      priceDisplay: "₹0",
      period: "/ month",
      text: "For trying the builder",
      items: [
        "1 active website",
        "3 generation credits",
        "Webbing subdomain only",
        "Webbing branding footer"
      ],
      featured: false,
      buttonText: "Choose Free",
      signUpUrl: "/signup?plan=starter"
    },
    {
      id: "pro-plan",
      name: "Pro Plan",
      priceDisplay: billingCycle === "monthly" ? "₹599" : "₹6,468",
      period: billingCycle === "monthly" ? "/ month" : "/ year",
      text: "For creators and teams",
      items: [
        "10 active websites",
        "100 credits per month",
        "Custom domains support",
        "White-labeled workspace",
        "Commerce store builder",
        "Priority email support"
      ],
      featured: true,
      buttonText: "Choose Pro",
      signUpUrl: billingCycle === "monthly" ? "/signup?plan=pro-plan" : "/signup?plan=pro-plan-annual",
      discountBadge: billingCycle === "annually" ? "Save 10%" : null,
      subText: billingCycle === "annually" ? "Equivalent to ₹539/month" : null
    },
    {
      id: "agency",
      name: "Agency",
      priceDisplay: billingCycle === "monthly" ? "₹2,499" : "₹25,488",
      period: billingCycle === "monthly" ? "/ month" : "/ year",
      text: "For client production",
      items: [
        "Unlimited projects",
        "500 credits per month",
        "Custom domains support",
        "White-labeled workspace",
        "Dedicated LLM API keys",
        "Priority 24/7 support"
      ],
      featured: false,
      buttonText: "Choose Agency",
      signUpUrl: billingCycle === "monthly" ? "/signup?plan=agency" : "/signup?plan=agency-annual",
      discountBadge: billingCycle === "annually" ? "Save 15%" : null,
      subText: billingCycle === "annually" ? "Equivalent to ₹2124/month" : null
    }
  ];

  return (
    <section id="pricing" className="section-band">
      <div className="section-copy" style={{ textAlign: "center", margin: "0 auto 2.5rem auto", maxWidth: "600px" }}>
        <span className="eyebrow">Pricing</span>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Plans that scan clearly.</h2>
        <p>Simple tiers, clearer spacing, and calls to action that do not stack awkwardly down the page.</p>

        {/* Billing Cycle Switcher */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", marginTop: "2rem", background: "rgba(255,255,255,0.03)", padding: "0.4rem 1rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={{
              background: billingCycle === "monthly" ? "linear-gradient(135deg, #4f7cff, #20c7b5)" : "transparent",
              border: "none",
              color: "#fff",
              padding: "0.4rem 1.2rem",
              borderRadius: "1.5rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annually")}
            style={{
              background: billingCycle === "annually" ? "linear-gradient(135deg, #4f7cff, #20c7b5)" : "transparent",
              border: "none",
              color: "#fff",
              padding: "0.4rem 1.2rem",
              borderRadius: "1.5rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            Annually
            <span style={{ fontSize: "0.7rem", background: "rgba(61, 220, 151, 0.2)", color: "#3ddc97", padding: "0.1rem 0.4rem", borderRadius: "10px", fontWeight: 800 }}>
              Up to 15% off
            </span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="eyebrow">{plan.name}</span>
                {plan.discountBadge && (
                  <span style={{ fontSize: "0.7rem", background: "rgba(61, 220, 151, 0.15)", color: "#3ddc97", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                    {plan.discountBadge}
                  </span>
                )}
              </div>
              <span className="price" style={{ margin: "1rem 0 0.5rem 0" }}>
                {plan.priceDisplay}
                <small style={{ fontSize: "1rem", color: "#9aa7bd", fontWeight: 400 }}>{plan.period}</small>
              </span>
              {plan.subText && (
                <span style={{ display: "block", fontSize: "0.8rem", color: "#3ddc97", marginBottom: "1rem", fontWeight: 600 }}>
                  {plan.subText}
                </span>
              )}
              <p style={{ marginBottom: "1.5rem" }}>{plan.text}</p>
              <ul style={{ minHeight: "12rem" }}>
                {plan.items.map((item) => (
                  <li key={item}><CheckCircle2 size={17} color="#3ddc97" /> {item}</li>
                ))}
              </ul>
            </div>
            <a className={plan.featured ? "primary-action" : "secondary-action"} href={plan.signUpUrl} style={{ width: "100%", justifyContent: "center" }}>
              {plan.buttonText}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
