import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@webbing/db";
import { CheckCircle2, Mail, ArrowRight, Zap, Star, ArrowUpRight, Phone } from "lucide-react";

export default async function GeneratedSitePage({ params }: { params: { subdomain: string; path?: string[] } }) {
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
        pages: {
          include: {
            sections: { orderBy: { order: "asc" } }
          }
        }
      },
    });
  }

  if (!project) notFound();

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
        const type = section.type.toUpperCase();

        switch (type) {
          case "HEADER": {
            const links = content.links || [
              { label: "Features", url: "#features" },
              { label: "Pricing", url: "#pricing" },
              { label: "About", url: "#about" },
              { label: "Contact", url: "#contact" }
            ];
            return (
              <header key={section.id} className="reveal-on-scroll active" style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 2rem", background: "rgba(6, 9, 20, 0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <a href="#" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.40rem", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", fontSize: "1rem" }}>W</span>
                  {project.name}
                </a>
                <nav style={{ display: "flex", gap: "1.5rem" }}>
                  {links.map((link: any, i: number) => (
                    <a key={i} href={link.url} style={{ color: "#9ca3af", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}>
                      {link.label}
                    </a>
                  ))}
                </nav>
                <a className="primary-action" href={content.ctaUrl || "#contact"} style={{ minHeight: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem", borderRadius: "0.4rem" }}>
                  {content.ctaText || "Get Started"}
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
                      {designStyle} Style
                    </span>
                    <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 850, lineHeight: 1.05, margin: "1rem 0", color: "#fff" }}>
                      <span className={textGradClass}>{content.heading || page.title}</span>
                    </h1>
                    <p style={{ color: "#9ca3af", fontSize: "1.15rem", lineHeight: 1.6, margin: "0 0 2rem 0", maxWidth: "600px" }}>
                      {content.subheading || page.description || project.description}
                    </p>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <a className="primary-action" href={content.ctaUrl || "#contact"}>
                        {content.ctaText || "Contact Us"} <ArrowRight size={16} />
                      </a>
                      {content.secondaryCtaText && (
                        <a className="secondary-action" href={content.secondaryCtaUrl || "#features"}>
                          {content.secondaryCtaText}
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
                        <span>{project.status}</span>
                        <span>{project.subdomain}</span>
                      </div>
                    </aside>
                  )}
                </div>
              </section>
            );
          }

          case "FEATURES": {
            const items = content.items || [
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
                  {items.map((item: any, i: number) => (
                    <article className="feature-card glass-card" key={i} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <span className="icon-box" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", width: "3rem", height: "3rem", borderRadius: "0.5rem" }}>
                        <CheckCircle2 size={20} />
                      </span>
                      <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#fff", fontWeight: 700 }}>{item.title}</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          }

          case "SERVICES": {
            const services = content.services || [
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
                  {services.map((srv: any, i: number) => (
                    <article className="feature-card glass-card" key={i} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "2.2rem", position: "relative" }}>
                      {srv.badge && (
                        <span style={{ position: "absolute", top: "1rem", right: "1rem", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                          {srv.badge}
                        </span>
                      )}
                      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.3rem", color: "#fff", fontWeight: 700 }}>{srv.title}</h3>
                      <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{srv.desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          }

          case "TESTIMONIALS": {
            const reviews = content.testimonials || [
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
                <div style={{ display: "grid", gridTemplateColumns: reviews.length > 2 ? "repeat(3, 1fr)" : "repeat(2, 1fr)", gap: "1.5rem" }}>
                  {reviews.map((rev: any, i: number) => (
                    <div className="glass-panel" key={i} style={{ borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div style={{ display: "flex", gap: "0.2rem" }}>
                        {[...Array(5)].map((_, starIdx) => (
                          <Star key={starIdx} size={15} fill="#fbbf24" stroke="none" />
                        ))}
                      </div>
                      <p style={{ color: "#e2e8f0", fontSize: "1rem", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                        "{rev.quote}"
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                          {(rev.author && rev.author.length > 0) ? rev.author[0] : "U"}
                        </div>
                        <div>
                          <strong style={{ color: "#fff", display: "block", fontSize: "0.9rem" }}>{rev.author || "Anonymous"}</strong>
                          <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{rev.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "PRICING": {
            const plans = content.plans || [
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
                  {plans.map((pl: any, i: number) => (
                    <article className={`pricing-card ${pl.featured ? "featured" : "glass-card"}`} key={i} style={{ border: pl.featured ? "2px solid #818cf8" : "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem", padding: "2.5rem", display: "flex", flexDirection: "column", justifySelf: "stretch", boxShadow: pl.featured ? "0 10px 30px rgba(99,102,241,0.25)" : "none" }}>
                      <span className="eyebrow" style={{ fontSize: "0.75rem" }}>{pl.name}</span>
                      <div style={{ display: "flex", alignItems: "baseline", margin: "1rem 0" }}>
                        <span style={{ fontSize: "3rem", fontWeight: 850, color: pl.featured ? "#818cf8" : "#fff" }}>{pl.price}</span>
                        <span style={{ color: "#9ca3af", fontSize: "0.9rem", marginLeft: "0.25rem" }}>/mo</span>
                      </div>
                      <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0 0 2rem 0", minHeight: "2.5rem" }}>{pl.desc}</p>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "flex", flexDirection: "column", gap: "0.8rem", flexGrow: 1 }}>
                        {(pl.items || []).map((item: string, j: number) => (
                          <li key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#cbd5e1" }}>
                            <CheckCircle2 size={16} color="#34d399" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <a className={pl.featured ? "primary-action" : "secondary-action"} href="#contact" style={{ width: "100%", textAlign: "center", display: "block" }}>
                        Choose {pl.name}
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            );
          }

          case "FAQS": {
            const items = content.faqs || [
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
                  {items.map((item: any, i: number) => (
                    <details key={i} className="glass-panel" style={{ borderRadius: "0.75rem", padding: "1.25rem", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <summary style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {item.q}
                        <span style={{ fontSize: "1.2rem", color: "#818cf8" }}>+</span>
                      </summary>
                      <p style={{ color: "#9ca3af", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "1rem", cursor: "default" }}>
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            );
          }

          case "CTA": {
            return (
              <section key={section.id} className="reveal-on-scroll" style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                <div className="glass-panel" style={{ borderRadius: "1.5rem", padding: "4rem 2rem", textAlign: "center", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(217, 70, 239, 0.15))", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                  <h2 style={{ fontSize: "2.5rem", fontWeight: 850, color: "#fff", margin: 0, textAlign: "center" }}>
                    {content.heading || "Ready to build your presence?"}
                  </h2>
                  <p style={{ color: "#cbd5e1", fontSize: "1.1rem", maxWidth: "600px", textAlign: "center", margin: 0 }}>
                    {content.subheading || "Create premium, responsive, animation-driven sites dynamically with Webbing."}
                  </p>
                  <a className="primary-action" href={content.ctaUrl || "#contact"} style={{ marginTop: "1rem" }}>
                    {content.ctaText || "Get Started Instantly"}
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
                      {content.heading || "Our Story"}
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.7, margin: 0 }}>
                      {content.body}
                    </p>
                  </div>
                </div>
              </section>
            );
          }

          case "CONTACT": {
            const email = content.email || "hello@example.com";
            return (
              <section key={section.id} id="contact" className="reveal-on-scroll" style={{ padding: "5rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "3rem" }}>
                  <div className="glass-panel" style={{ padding: "3rem", borderRadius: "1rem" }}>
                    <span className="eyebrow">Get In Touch</span>
                    <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0 2rem 0" }}>
                      {content.heading || "Start a Conversation"}
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
                      <a href={`mailto:${email}`} className={textGradClass} style={{ fontSize: "1.2rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.75rem" }}>
                        {email} <ArrowUpRight size={16} />
                      </a>
                    </div>
                    {content.phone && (
                      <div>
                        <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem" }}>Call Us</h3>
                        <a href={`tel:${content.phone}`} style={{ color: "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                          <Phone size={14} color="#818cf8" /> {content.phone}
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
                <span>© {new Date().getFullYear()} {project.name}. All rights reserved.</span>
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
}
