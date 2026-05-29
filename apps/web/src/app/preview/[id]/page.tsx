import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@webbing/db";
import { CheckCircle2, Mail, DollarSign } from "lucide-react";

export default async function ProjectPreviewPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      pages: {
        include: {
          sections: { orderBy: { order: "asc" } }
        }
      }
    },
  });

  if (!project) notFound();

  // Find index page or default to the first page
  const page = project.pages.find((item) => item.slug === "index") || project.pages[0];
  if (!page) notFound();

  const hero = page.sections.find((section) => section.type === "HERO")?.content as any;
  const features = page.sections.find((section) => section.type === "FEATURES")?.content as any;
  const about = page.sections.find((section) => section.type === "ABOUT")?.content as any;
  const pricing = page.sections.find((section) => section.type === "PRICING")?.content as any;
  const contact = page.sections.find((section) => section.type === "CONTACT")?.content as any;

  const featureItems = Array.isArray(features?.items) ? features.items : [
    { title: "Fast launch", description: "A polished web presence generated from your business details." },
    { title: "Clear messaging", description: "Concise sections for value, proof, pricing, and contact." },
    { title: "Responsive layout", description: "A modern dark-first visual system for desktop and mobile." },
  ];

  const contactEmail = contact?.email || "hello@example.com";

  return (
    <div className="site-preview" style={{ padding: "0 1.5rem", minHeight: "100vh" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 0" }}>
        {/* HERO SECTION */}
        <section className="preview-hero">
          <div>
            <span className="eyebrow">{project.name}</span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 850, lineHeight: 1.1, margin: "0 0 1rem 0" }}>
              {hero?.heading || page.title}
            </h1>
            <p style={{ color: "#b8c3d4", fontSize: "1.1rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
              {hero?.subheading || page.description || project.description}
            </p>
            <a className="primary-action" href={hero?.ctaUrl || "#contact"} style={{ marginTop: 0 }}>
              {hero?.ctaText || "Contact us"}
            </a>
          </div>
          <aside className="preview-panel">
            <strong>Interactive Preview</strong>
            <p style={{ color: "#b8c3d4", fontSize: "0.85rem", margin: "0.5rem 0" }}>
              This is a live mockup of your generated website.
            </p>
            <div className="key-meta" style={{ flexWrap: "wrap" }}>
              <span>{project.status}</span>
              <span>{project.subdomain}</span>
            </div>
          </aside>
        </section>

        {/* FEATURES SECTION */}
        <section style={{ padding: "4rem 0 2rem 0" }}>
          <span className="eyebrow" style={{ textAlign: "center", display: "block" }}>Key Features</span>
          <div className="feature-grid" style={{ marginTop: "1.5rem" }}>
            {featureItems.slice(0, 3).map((item: any, index: number) => (
              <article className="feature-card" key={`${item.title}-${index}`}>
                <span className="icon-box"><CheckCircle2 size={20} /></span>
                <h3 style={{ margin: "1rem 0 0.5rem 0" }}>{item.title}</h3>
                <p style={{ color: "#b8c3d4", fontSize: "0.95rem", lineHeight: 1.5 }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ABOUT SECTION */}
        {about && (
          <section className="preview-panel" style={{ margin: "2rem 0", padding: "2.5rem" }}>
            <span className="eyebrow">About Us</span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0 1rem 0" }}>
              {about.heading || "Our Mission"}
            </h2>
            <p style={{ color: "#b8c3d4", fontSize: "1rem", lineHeight: 1.7, margin: 0 }}>
              {about.body}
            </p>
          </section>
        )}

        {/* PRICING SECTION */}
        {pricing && pricing.plans && pricing.plans.length > 0 && (
          <section style={{ padding: "3rem 0" }}>
            <span className="eyebrow" style={{ textAlign: "center", display: "block" }}>Pricing & Options</span>
            <div className="feature-grid" style={{ marginTop: "1.5rem" }}>
              {pricing.plans.map((plan: any, index: number) => (
                <article className="feature-card" key={`${plan.name}-${index}`} style={{ border: "1px solid rgba(129, 140, 248, 0.25)" }}>
                  <span className="icon-box"><DollarSign size={20} /></span>
                  <h3 style={{ margin: "1rem 0 0.25rem 0" }}>{plan.name}</h3>
                  <div style={{ fontSize: "2.2rem", fontWeight: 850, color: "#818cf8", margin: "0.5rem 0" }}>
                    {plan.price}
                  </div>
                  <p style={{ color: "#b8c3d4", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {plan.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CONTACT SECTION */}
        <section id="contact" className="preview-panel" style={{ marginTop: "3rem", padding: "2.5rem" }}>
          <span className="eyebrow"><Mail size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} /> Contact</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0.5rem 0 1rem 0" }}>
            {contact?.heading || "Let’s start a conversation."}
          </h2>
          <p style={{ color: "#b8c3d4", marginBottom: "1.5rem" }}>
            Reach out directly to find out more about our plans and services.
          </p>
          <a className="secondary-action" href={`mailto:${contactEmail}`} style={{ fontSize: "1rem" }}>
            {contactEmail}
          </a>
        </section>
      </main>
    </div>
  );
}
