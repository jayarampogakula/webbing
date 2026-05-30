import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@webbing/db";
import { CheckCircle2, Mail, ArrowRight, Zap, Star, ArrowUpRight, Phone } from "lucide-react";

// Safe text renderer helper to avoid React child object crashes
function renderText(val: any, fallback: string = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "object") {
    if (Object.keys(val).length === 0) return fallback;
    if (typeof val.text === "string") return val.text;
    if (typeof val.title === "string") return val.title;
    if (typeof val.name === "string") return val.name;
    if (typeof val.heading === "string") return val.heading;
  }
  return fallback;
}

// Safe URL renderer helper to avoid invalid href crashes
function renderUrl(val: any, fallback: string = "#"): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && typeof val.url === "string") return val.url;
  return fallback;
}

export default async function GeneratedSitePage({ params }: { params: { subdomain: string; path?: string[] } }) {
  try {
    const slug = params.path?.join("/") || "index";
    const hostnameOrSubdomain = params.subdomain.toLowerCase();

    let project = null;

    if (hostnameOrSubdomain.includes(".")) {
      // Lookup project by verified custom domain
      const customDomainRecord = await prisma.customDomain.findUnique({
        where: { hostname: hostnameOrSubdomain },
        include: {
          project: {
            include: {
              tenant: {
                include: { subscription: true }
              },
              pages: {
                include: {
                  sections: { orderBy: { order: "asc" } }
                }
              }
            }
          }
        }
      });
      // Resolve if the custom domain is mapped and verified
      if (customDomainRecord && customDomainRecord.verified) {
        project = customDomainRecord.project;
      }
    } else {
      // Lookup by standard subdomain
      project = await prisma.project.findUnique({
        where: { subdomain: hostnameOrSubdomain },
        include: {
          tenant: {
            include: { subscription: true }
          },
          pages: {
            include: {
              sections: { orderBy: { order: "asc" } }
            }
          }
        },
      });
    }

    if (!project) notFound();

    // Enforce subscription check (unless project is configured as self-hosted)
    if (!project.selfHosted) {
      const subscription = project.tenant?.subscription;
      const isExpired = !subscription || (
        subscription.status !== "ACTIVE" && 
        subscription.status !== "TRIALING"
      );

      if (isExpired) {
        return (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#060914", color: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "1rem", padding: "3rem 2rem", maxWidth: "480px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "inline-flex", padding: "1rem", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", marginBottom: "1.5rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.75rem 0", color: "#fff" }}>Website Temporarily Offline</h1>
              <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 2rem 0" }}>
                This site's hosting subscription has expired or is currently unpaid. If you are the owner, please log in to your Webbing dashboard to update your billing details.
              </p>
              <a href="https://webbing.in/dashboard" style={{ display: "inline-block", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", textDecoration: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 10px 20px rgba(99,102,241,0.2)" }}>
                Go to Dashboard
              </a>
            </div>
          </div>
        );
      }
    }

    const page = project.pages.find((item) => item.slug === slug) || project.pages.find((item) => item.slug === "index") || project.pages[0];
    if (!page) notFound();

    const themeConfig = (project.theme as any) || {};
    const designStyle = themeConfig.style || "Modern Startup";

    // Map theme styles to classes
    let bgClass = "bg-grad-saas";
    let textGradClass = "text-grad-saas";
    let fontClass = "font-gaming";

    if (designStyle === "Gaming") {
      bgClass = "bg-grad-gaming";
      textGradClass = "text-grad-gaming";
      fontClass = "font-gaming";
    } else if (designStyle === "Creator") {
      bgClass = "bg-grad-creator";
      textGradClass = "text-grad-creator";
      fontClass = "font-gaming";
    } else if (designStyle === "Luxury") {
      bgClass = "bg-grad-luxury";
      textGradClass = "text-grad-luxury";
      fontClass = "font-serif-lux";
    } else if (designStyle === "Fitness") {
      bgClass = "bg-grad-fitness";
      textGradClass = "text-grad-fitness";
      fontClass = "font-gaming";
    } else if (designStyle === "SaaS") {
      bgClass = "bg-grad-saas";
      textGradClass = "text-grad-saas";
      fontClass = "font-gaming";
    } else if (designStyle === "Modern Startup") {
      bgClass = "bg-grad-saas";
      textGradClass = "text-grad-saas";
      fontClass = "font-gaming";
    } else {
      bgClass = "bg-grad-saas";
      textGradClass = "text-grad-saas";
      fontClass = "font-gaming";
    }

    // Animation observer JS script injection
    const animationScript = `
      (function() {
        function initObserver() {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('active');
              }
            });
          }, { threshold: 0.05 });
          document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initObserver);
        } else {
          initObserver();
        }
      })();
    `;

    return (
      <div className={`site-preview ${bgClass} ${fontClass}`} style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
        {/* Dynamic Sections Loop */}
        {page.sections.map((section, idx) => {
          const content = (section.content as any) || {};
          const styles = (section.styles as any) || {};
          const type = (section.type || "").toUpperCase();

          switch (type) {
            case "HEADER": {
              const links = Array.isArray(content.links) ? content.links : [
                { label: "Features", url: "#features" },
                { label: "Pricing", url: "#pricing" },
                { label: "About", url: "#about" },
                { label: "Contact", url: "#contact" }
              ];
              return (
                <header key={section.id} className="reveal-on-scroll active" style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 2rem", background: "rgba(6, 9, 20, 0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <a href="#" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.40rem", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", fontSize: "1rem" }}>W</span>
                    {renderText(project.name)}
                  </a>
                  <nav style={{ display: "flex", gap: "1.5rem" }}>
                    {links.map((link: any, i: number) => {
                      if (!link) return null;
                      return (
                        <a key={i} href={renderUrl(link.url)} style={{ color: "#9ca3af", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>
                          {renderText(link.label || "")}
                        </a>
                      );
                    })}
                  </nav>
                  <a className="primary-action" href={renderUrl(content.ctaUrl, "#contact")} style={{ minHeight: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "0.4rem" }}>
                    {renderText(content.ctaText, "Get Started")}
                  </a>
                </header>
              );
            }

            case "HERO": {
              return (
                <section key={section.id} className="reveal-on-scroll active" style={{ padding: "6rem 2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div className="preview-hero" style={{ width: "100%", maxWidth: "1100px", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3rem", alignItems: "center" }}>
                    <div>
                      <span className="eyebrow" style={{ background: "rgba(99, 102, 241, 0.1)", padding: "0.3rem 0.8rem", borderRadius: "999px", color: "#a5b4fc", fontSize: "0.75rem" }}>
                        {renderText(designStyle)} Style
                      </span>
                      <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 850, lineHeight: 1.05, margin: "1rem 0", color: "#fff" }}>
                        <span className={textGradClass}>{renderText(content.heading, page.title || "")}</span>
                      </h1>
                      <p style={{ color: "#9ca3af", fontSize: "1.15rem", lineHeight: 1.6, margin: "0 0 2rem 0", maxWidth: "600px" }}>
                        {renderText(content.subheading, page.description || project.description || "")}
                      </p>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <a className="primary-action" href={renderUrl(content.ctaUrl, "#contact")}>
                          {renderText(content.ctaText, "Contact Us")} <ArrowRight size={16} />
                        </a>
                        {content.secondaryCtaText && (
                          <a className="secondary-action" href={renderUrl(content.secondaryCtaUrl, "#features")}>
                            {renderText(content.secondaryCtaText)}
                          </a>
                        )}
                      </div>
                    </div>
                    {content.imageUrl ? (
                      <div className="animate-float" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                        <img src={content.imageUrl} alt="Visual" style={{ width: "100%", maxWidth: "450px", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", objectFit: "cover", aspectRatio: "4/3" }} />
                        <div className="glass-panel" style={{ position: "absolute", bottom: "-1.5rem", left: "-1rem", padding: "1rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Zap size={16} color="#c084fc" />
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>Ready to Publish</span>
                        </div>
                      </div>
                    ) : (
                      <aside className="preview-panel animate-float" style={{ padding: "2.5rem" }}>
                        <strong>AI Website Builder</strong>
                        <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.5rem 0", lineHeight: 1.5 }}>
                          This website runs on Webbing's premium design engine.
                        </p>
                        <div className="key-meta" style={{ flexWrap: "wrap", marginTop: "1rem" }}>
                          <span>{renderText(project.status)}</span>
                          <span>{renderText(project.subdomain)}</span>
                        </div>
                      </aside>
                    )}
                  </div>
                </section>
              );
            }

            case "FEATURES": {
              const items = Array.isArray(content.items) ? content.items : [
                { title: "Smart Generation", description: "Creates sections and copywriting aligned with your niche prompt details." },
                { title: "Vibrant Styling", description: "Glassmorphic interfaces, tailored grid schemes, and custom color presets." },
                { title: "Production Ready", description: "Optimized HTML/CSS structure ready for hosting or custom exports." }
              ];
              return (
                <section key={section.id} id="features" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <span className="eyebrow">Features</span>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      Designed to Perform
                    </h2>
                    <p style={{ color: "#9ca3af" }}>Engineered for rich presentation and modern responsive compatibility.</p>
                  </div>
                  <div className="feature-grid">
                    {items.map((item: any, i: number) => {
                      if (!item) return null;
                      return (
                        <article className="feature-card glass-card" key={i} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <span className="icon-box" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", borderRadius: "0.5rem" }}>
                            <CheckCircle2 size={20} />
                          </span>
                          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#fff", fontWeight: 700 }}>{renderText(item.title || "")}</h3>
                          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{renderText(item.description || "")}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "SERVICES": {
              const services = Array.isArray(content.services) ? content.services : [
                { title: "Core Design", desc: "Premium styling matching your specific target niche.", badge: "Popular" },
                { title: "Subdomain Mapping", desc: "Instant deployment with fully configured system records." },
                { title: "SEO Configurations", desc: "Automated search engine description meta tags." }
              ];
              return (
                <section key={section.id} id="services" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <span className="eyebrow">Our Services</span>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      What We Offer
                    </h2>
                    <p style={{ color: "#9ca3af" }}>Highly tailored solutions created dynamically to solve business requirements.</p>
                  </div>
                  <div className="feature-grid">
                    {services.map((srv: any, i: number) => {
                      if (!srv) return null;
                      const badgeText = renderText(srv.badge);
                      return (
                        <article className="feature-card glass-card" key={i} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "2.2rem", position: "relative" }}>
                          {badgeText && (
                            <span style={{ position: "absolute", top: "1rem", right: "1rem", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                              {badgeText}
                            </span>
                          )}
                          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem", color: "#fff", fontWeight: 700 }}>{renderText(srv.title || "")}</h3>
                          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{renderText(srv.desc || "")}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "TESTIMONIALS": {
              const reviews = Array.isArray(content.testimonials) ? content.testimonials : [
                { quote: "This builder completely changed how we test landing pages. The visual aesthetics are incredible.", author: "Sarah Jenkins", role: "Product Director" },
                { quote: "Instant publishing with automatic SSL and DNS validations means we launch with complete peace of mind.", author: "Marcus Vance", role: "Creative Lead" }
              ];
              return (
                <section key={section.id} id="testimonials" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <span className="eyebrow">Testimonials</span>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      Trusted By Builders
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: (reviews && reviews.length > 2) ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: "1.5rem" }}>
                    {reviews.map((rev: any, i: number) => {
                      if (!rev) return null;
                      return (
                        <div className="glass-panel" key={i} style={{ borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                          <div style={{ display: "flex", gap: "0.2rem" }}>
                            {[...Array(5)].map((_, starIdx) => (
                              <Star key={starIdx} size={15} fill="#fbbf24" stroke="none" />
                            ))}
                          </div>
                          <p style={{ color: "#e2e8f0", fontSize: "1rem", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                            "{renderText(rev.quote || "")}"
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                              {renderText(rev.author ? rev.author[0] : "U")}
                            </div>
                            <div>
                              <strong style={{ color: "#fff", display: "block", fontSize: "0.9rem" }}>{renderText(rev.author, "Anonymous")}</strong>
                              <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{renderText(rev.role || "")}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "PRICING": {
              const plans = Array.isArray(content.plans) ? content.plans : [
                { name: "Starter", price: "$0", desc: "Ideal for testing layout setups.", items: ["1 Active Site", "Free Subdomain", "Basic Analytics"] },
                { name: "Pro Plan", price: "$29", desc: "Best for teams and content creators.", items: ["10 Sites", "Custom Domain Maps", "Priority Support", "Unlimited AI Updates"], featured: true },
                { name: "Agency", price: "$99", desc: "For scaling client delivery.", items: ["Unlimited Sites", "White-labeled exports", "Dedicated APIs"] }
              ];
              return (
                <section key={section.id} id="pricing" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <span className="eyebrow">Pricing Plans</span>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      Select Your Plan
                    </h2>
                  </div>
                  <div className="feature-grid">
                    {plans.map((pl: any, i: number) => {
                      if (!pl) return null;
                      return (
                        <article className={`pricing-card ${pl.featured ? "featured" : "glass-card"}`} key={i} style={{ border: pl.featured ? "2px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", justifySelf: "stretch", boxShadow: pl.featured ? "0 10px 30px rgba(99,102,241,0.25)" : "none" }}>
                          <span className="eyebrow" style={{ fontSize: "0.75rem" }}>{renderText(pl.name || "")}</span>
                          <div style={{ display: "flex", alignItems: "baseline", margin: "1rem 0" }}>
                            <span style={{ fontSize: "3rem", fontWeight: 850, color: pl.featured ? "#818cf8" : "#fff" }}>{renderText(pl.price || "")}</span>
                            <span style={{ color: "#9ca3af", fontSize: "0.9rem", marginLeft: "0.25rem" }}>/mo</span>
                          </div>
                          <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0 0 2rem 0", minHeight: "2.5rem" }}>{renderText(pl.desc || "")}</p>
                          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "flex", flexDirection: "column", gap: "0.8rem", flexGrow: 1 }}>
                            {Array.isArray(pl.items) && pl.items.map((item: string, j: number) => (
                              <li key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                                <CheckCircle2 size={16} color="#34d399" />
                                {renderText(item || "")}
                              </li>
                            ))}
                          </ul>
                          <a className={pl.featured ? "primary-action" : "secondary-action"} href="#contact" style={{ width: "100%", textAlign: "center", display: "block" }}>
                            Choose {renderText(pl.name || "")}
                          </a>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "FAQS": {
              const items = Array.isArray(content.faqs) ? content.faqs : [
                { q: "How do custom domain integrations work?", a: "Save your hostname in dashboard domain settings, configure the matching CNAME/A record on your registrar, and run verification. SSL certificate issuance happens automatically." },
                { q: "Can I download static HTML archives?", a: "Yes. Use the download options menu on the builder control bar to download your website as static code bundles, React components, or Next.js projects." }
              ];
              return (
                <section key={section.id} id="faqs" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
                  <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <span className="eyebrow">FAQs</span>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                      Frequently Asked Questions
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {items.map((item: any, i: number) => {
                      if (!item) return null;
                      return (
                        <details key={i} className="glass-panel" style={{ borderRadius: "0.75rem", padding: "1.25rem", cursor: "pointer", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                          <summary style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {renderText(item.q || "")}
                            <span style={{ fontSize: "1.2rem", color: "#818cf8" }}>+</span>
                          </summary>
                          <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "1rem", cursor: "default" }}>
                            {renderText(item.a || "")}
                          </p>
                        </details>
                      );
                    })}
                  </div>
                </section>
              );
            }

            case "CTA": {
              return (
                <section key={section.id} className="reveal-on-scroll" style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div className="glass-panel" style={{ borderRadius: "1.5rem", padding: "4rem 2rem", textAlign: "center", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(217, 70, 239, 0.15))", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                    <h2 style={{ fontSize: "2.5rem", fontWeight: 850, color: "#fff", margin: 0, textAlign: "center" }}>
                      {renderText(content.heading, "Ready to build your presence?")}
                    </h2>
                    <p style={{ color: "#cbd5e1", fontSize: "1.1rem", maxWidth: "600px", textAlign: "center", margin: 0 }}>
                      {renderText(content.subheading, "Create premium, responsive, animation-driven sites dynamically with Webbing.")}
                    </p>
                    <a className="primary-action" href={renderUrl(content.ctaUrl, "#contact")} style={{ marginTop: "1rem" }}>
                      {renderText(content.ctaText, "Get Started Instantly")}
                    </a>
                  </div>
                </section>
              );
            }

            case "ABOUT": {
              return (
                <section key={section.id} id="about" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div className="preview-hero" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
                    {content.imageUrl && (
                      <img src={content.imageUrl} alt="About" style={{ width: "100%", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 15px 35px rgba(0,0,0,0.4)", objectFit: "cover", aspectRatio: "16/10" }} />
                    )}
                    <div>
                      <span className="eyebrow">About Us</span>
                      <h2 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0 1rem 0" }}>
                        {renderText(content.heading, "Our Story")}
                      </h2>
                      <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.7, margin: 0 }}>
                        {renderText(content.body || "")}
                      </p>
                    </div>
                  </div>
                </section>
              );
            }

            case "CONTACT": {
              const rawEmail = renderText(content.email, "hello@example.com");
              const rawPhone = renderText(content.phone);
              return (
                <section key={section.id} id="contact" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "3rem" }}>
                    <div className="glass-panel" style={{ padding: "3rem", borderRadius: "1rem" }}>
                      <span className="eyebrow">Get In Touch</span>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0 2rem 0" }}>
                        {renderText(content.heading, "Start a Conversation")}
                      </h2>
                      <form style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }} onSubmit={(e) => e.preventDefault()}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="field-group">
                            <label>Full Name</label>
                            <input type="text" className="field" placeholder="John Doe" />
                          </div>
                          <div className="field-group">
                            <label>Email Address</label>
                            <input type="email" className="field" placeholder="john@company.com" />
                          </div>
                        </div>
                        <div className="field-group">
                          <label>Your Message</label>
                          <textarea className="field" rows={4} placeholder="Tell us about your project..."></textarea>
                        </div>
                        <button className="primary-action" type="button" style={{ alignSelf: "flex-start", minHeight: "auto", padding: "0.75rem 1.5rem" }}>
                          Send Message
                        </button>
                      </form>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2rem", paddingLeft: "1rem" }}>
                      <div>
                        <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.4rem" }}>Direct Contact</h3>
                        <p style={{ color: "#9ca3af", margin: 0 }}>Reach out directly to find out more about our plans and services.</p>
                        <a href={`mailto:${rawEmail}`} className={textGradClass} style={{ fontSize: "1.2rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.75rem" }}>
                          {rawEmail} <ArrowUpRight size={16} />
                        </a>
                      </div>
                      {rawPhone && (
                        <div>
                          <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Call Us</h3>
                          <a href={`tel:${rawPhone}`} style={{ color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <Phone size={14} color="#818cf8" /> {rawPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            }

            case "FOOTER": {
              return (
                <footer key={section.id} className="reveal-on-scroll active" style={{ padding: "3rem 2rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1100px", margin: "0 auto", color: "#9ca3af", fontSize: "0.85rem" }}>
                  <span>© {new Date().getFullYear()} {renderText(project.name)}. All rights reserved.</span>
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <a href="#" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>Privacy Policy</a>
                    <a href="#" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>Terms of Service</a>
                  </div>
                </footer>
              );
            }

            default:
              return null;
          }
        })}

        {/* Animation Engine Trigger script */}
        <script dangerouslySetInnerHTML={{ __html: animationScript }} />
      </div>
    );
  } catch (err: any) {
    if (err.message === "NEXT_NOT_FOUND" || err.digest === "NEXT_NOT_FOUND") {
      throw err;
    }
    console.error("Rendering error:", err);
    return (
      <div style={{ padding: "2rem", color: "#f87171", background: "#0b0f19", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", margin: "2rem", fontFamily: "sans-serif" }}>
        <h3 style={{ margin: "0 0 1rem 0" }}>Preview Rendering Exception</h3>
        <p><strong>Error Message:</strong> {err.message || String(err)}</p>
        <p><strong>Stack Trace:</strong></p>
        <pre style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.5)", padding: "1rem", borderRadius: "0.25rem", color: "#cbd5e1", overflowX: "auto" }}>
          {err.stack || "No stack trace available."}
        </pre>
      </div>
    );
  }
}
