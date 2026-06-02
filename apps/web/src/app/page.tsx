import React from "react";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import GeneratorForm from "./GeneratorForm";
import MarketingHeader from "./components/MarketingHeader";
import { CheckCircle2, Compass, Globe2, Layers3, Mail, ShieldCheck, Sparkles, Zap, ShoppingCart, MessageSquare, Code, DollarSign } from "lucide-react";
import PricingSection from "./components/PricingSection";

const features = [
  { icon: Sparkles, title: "AI copy and layout", text: "Generate structured pages, hero copy, pricing blocks, feature grids, and contact sections from one prompt." },
  { icon: Layers3, title: "Modern component system", text: "Every website is composed from reusable sections that are easier to edit, inspect, and expand." },
  { icon: Globe2, title: "Subdomain publishing", text: "Publish projects to instant subdomains with custom-domain workflows ready for paid plans." },
  { icon: ShieldCheck, title: "Provider key controls", text: "Admins can configure global LLM keys while users can bring their own provider credentials." },
  { icon: ShoppingCart, title: "eCommerce Storefronts", text: "Generate complete single-vendor stores with shopping carts, checkout logic, product variants, inventory, and payment setup." },
  { icon: DollarSign, title: "Annual Subscriptions", text: "Switch to annual cycles to save up to 15% on paid plan quotas, making client sites highly affordable." },
  { icon: Code, title: "White-labeled ZIP Export", text: "Download fully offline-ready HTML, CSS, and vanilla JS archives of your sites, free of engine tags or scripts." },
  { icon: MessageSquare, title: "Integrated Feedback System", text: "Submit suggestions or report bugs directly from the dashboard panel. View resolved support tickets instantly." }
];

export default function LandingPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  return (
    <div className="app-shell">
      <MarketingHeader user={user} />

      <main id="home">
        <section className="hero">
          <div>
            <span className="eyebrow"><Zap size={14} /> AI website SaaS</span>
            <h1>Build polished websites with AI in one flow.</h1>
            <p>
              Describe the business once and Webbing assembles a modern site with home, features, pricing,
              about, contact, hosting, and provider-aware AI routing.
            </p>
            <div className="hero-stats">
              <div className="stat-tile"><strong>60s</strong><span>first draft</span></div>
              <div className="stat-tile"><strong>6+</strong><span>LLM providers</span></div>
              <div className="stat-tile"><strong>5</strong><span>core pages</span></div>
            </div>
          </div>
          <GeneratorForm user={user} />
        </section>

        <section id="features" className="section-band">
          <div className="section-copy">
            <span className="eyebrow">Features</span>
            <h2>Everything feels connected now.</h2>
            <p>The builder, pricing, account pages, generated websites, and LLM settings share one restrained product interface.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="feature-card" key={feature.title}>
                  <span className="icon-box"><Icon size={22} /></span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <PricingSection />


        <section id="about" className="section-band">
          <div className="about-contact-grid">
            <div className="surface-panel">
              <span className="eyebrow"><Compass size={14} /> About us</span>
              <h2>Webbing is built for fast, useful site production.</h2>
              <p style={{ color: "#9aa7bd" }}>
                The platform combines prompt-driven generation, reusable page sections, publishing workflows,
                and admin-level provider controls so teams can build without wrestling with scattered tools.
              </p>
            </div>
            <div id="contact" className="surface-panel">
              <span className="eyebrow"><Mail size={14} /> Contact us</span>
              <h2>Need a custom workflow?</h2>
              <p style={{ color: "#9aa7bd" }}>Reach the Webbing team for provider setup, agency plans, domain support, and enterprise onboarding.</p>
              <a className="primary-action" href="mailto:support@webbing.in">support@webbing.in</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "0.5rem" }}>
          <a href="/terms" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Terms & Conditions</a>
          <a href="/privacy" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Privacy Policy</a>
          <a href="/cookies" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Cookies Policy</a>
          <a href="/refund" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}>Refund Policy</a>
        </div>
        <div style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
