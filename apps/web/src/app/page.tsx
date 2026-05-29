import React from "react";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import GeneratorForm from "./GeneratorForm";
import { CheckCircle2, Compass, Globe2, Layers3, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI copy and layout", text: "Generate structured pages, hero copy, pricing blocks, feature grids, and contact sections from one prompt." },
  { icon: Layers3, title: "Modern component system", text: "Every website is composed from reusable sections that are easier to edit, inspect, and expand." },
  { icon: Globe2, title: "Subdomain publishing", text: "Publish projects to instant subdomains with custom-domain workflows ready for paid plans." },
  { icon: ShieldCheck, title: "Provider key controls", text: "Admins can configure global LLM keys while users can bring their own provider credentials." },
];

const plans = [
  { name: "Free", price: "$0", text: "For trying the builder", items: ["1 active website", "5 generation credits", "Webbing subdomain"], featured: false },
  { name: "Pro", price: "$29", text: "For creators and teams", items: ["10 active websites", "100 credits per month", "Custom domains", "Commerce sections"], featured: true },
  { name: "Agency", price: "$99", text: "For client production", items: ["Unlimited projects", "500 credits per month", "White-label workspace", "Priority support"], featured: false },
];

export default function LandingPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  return (
    <div className="app-shell">
      <header className="site-nav">
        <a className="brand" href="#home">
          <span className="brand-mark"><Sparkles size={18} /></span>
          Webbing
        </a>
        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About us</a>
          <a href="#contact">Contact us</a>
          {user && <a href="/dashboard">Dashboard</a>}
          {user?.role === "ADMIN" && <a href="/admin">Admin</a>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
              <a className="danger-action" href="/api/auth/signout">Sign out</a>
            </>
          ) : (
            <>
              <a className="secondary-action" href="/signin">Sign in</a>
              <a className="primary-action" href="/signup">Sign up</a>
            </>
          )}
        </div>
      </header>

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

        <section id="pricing" className="section-band">
          <div className="section-copy">
            <span className="eyebrow">Pricing</span>
            <h2>Plans that scan clearly.</h2>
            <p>Simple tiers, clearer spacing, and calls to action that do not stack awkwardly down the page.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
                <span className="eyebrow">{plan.name}</span>
                <span className="price">{plan.price}<small> / month</small></span>
                <p>{plan.text}</p>
                <ul>
                  {plan.items.map((item) => (
                    <li key={item}><CheckCircle2 size={17} color="#3ddc97" /> {item}</li>
                  ))}
                </ul>
                <a className={plan.featured ? "primary-action" : "secondary-action"} href="/signup">Choose {plan.name}</a>
              </article>
            ))}
          </div>
        </section>

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

      <footer className="footer">© {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved.</footer>
    </div>
  );
}
