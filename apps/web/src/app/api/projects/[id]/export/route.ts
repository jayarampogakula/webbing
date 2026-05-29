import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import JSZip from "jszip";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
      include: {
        pages: {
          include: {
            sections: { orderBy: { order: "asc" } }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const zip = new JSZip();

    // 1. Generate CSS file
    const cssContent = `
/* Webbing Exported Theme Stylesheet */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --background-dark: #07111b;
  --text-light: #ffffff;
  --text-muted: #b8c3d4;
  --accent-purple: #c084fc;
  --accent-indigo: #818cf8;
  --accent-green: #34d399;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--background-dark);
  color: var(--text-light);
  -webkit-font-smoothing: antialiased;
}

.site-preview {
  min-height: 100vh;
  background:
    linear-gradient(145deg, rgba(246, 184, 75, 0.16), transparent 28%),
    linear-gradient(315deg, rgba(32, 199, 181, 0.14), transparent 30%),
    #07111b;
}

.site-preview main {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 5rem 0;
}

.preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 2rem;
  align-items: center;
}

@media (max-width: 900px) {
  .preview-hero {
    grid-template-columns: 1fr;
  }
}

.preview-hero h1 {
  margin: 0;
  font-size: clamp(2.6rem, 6vw, 5rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.preview-panel {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.07);
}

.eyebrow {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-indigo);
  margin-bottom: 0.75rem;
}

.primary-action {
  display: inline-block;
  background: linear-gradient(to right, #6366f1, #d946ef);
  color: white;
  padding: 0.85rem 2rem;
  border-radius: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  font-size: 0.95rem;
  transition: opacity 0.2s;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(217, 70, 239, 0.25);
}

.primary-action:hover {
  opacity: 0.9;
}

.secondary-action {
  display: inline-block;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.secondary-action:hover {
  background: rgba(255, 255, 255, 0.1);
}

.key-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.key-meta span {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  color: var(--text-muted);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 2rem;
}

.feature-card h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.feature-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: rgba(129, 140, 248, 0.15);
  color: var(--accent-indigo);
}

#contact h2 {
  margin: 0.5rem 0 1rem 0;
  font-size: 2rem;
  font-weight: 800;
}

#contact p {
  margin-bottom: 1.5rem;
  font-size: 1rem;
}
`;
    zip.file("style.css", cssContent);

    // 2. Generate HTML file for each page
    for (const page of project.pages) {
      const hero = page.sections.find((section) => section.type === "HERO")?.content as any;
      const features = page.sections.find((section) => section.type === "FEATURES")?.content as any;
      const items = Array.isArray(features?.items) ? features.items : [
        { title: "Fast launch", description: "A polished web presence generated from your business details." },
        { title: "Clear messaging", description: "Concise sections for value, proof, pricing, and contact." },
        { title: "Responsive layout", description: "A modern dark-first visual system for desktop and mobile." },
      ];

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title || project.name}</title>
  <meta name="description" content="${page.description || project.description || ''}">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="site-preview">
    <main>
      <section class="preview-hero">
        <div>
          <span class="eyebrow">${project.name}</span>
          <h1>${hero?.heading || page.title || "Welcome"}</h1>
          <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.5; margin-top: 1rem;">
            ${hero?.subheading || page.description || project.description || ''}
          </p>
          <a class="primary-action" href="${hero?.ctaUrl || '#contact'}">${hero?.ctaText || 'Contact us'}</a>
        </div>
        <aside class="preview-panel">
          <strong style="display: block; font-size: 1.1rem; margin-bottom: 0.5rem;">Self-Hosted Site</strong>
          <p style="color: var(--text-muted); margin: 0; font-size: 0.9rem; line-height: 1.4;">
            This site is fully exported and running on your own hosting server.
          </p>
          <div class="key-meta">
            <span>Status: Active</span>
            <span>Version: 1.0.0</span>
          </div>
        </aside>
      </section>

      <section style="padding: 4rem 0;">
        <div class="feature-grid">
          ${items.slice(0, 3).map((item: any) => `
          <article class="feature-card">
            <span class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </span>
            <h3>${item.title || ''}</h3>
            <p>${item.description || ''}</p>
          </article>
          `).join('\n')}
        </div>
      </section>

      <section id="contact" class="preview-panel">
        <span class="eyebrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          Contact
        </span>
        <h2 style="margin-top: 0.5rem;">Let’s talk about your next project.</h2>
        <p style="color: var(--text-muted);">This generated site includes a contact-ready section and is now fully self-hosted.</p>
        <a class="secondary-action" href="mailto:hello@example.com">hello@example.com</a>
      </section>
    </main>
  </div>
</body>
</html>`;

      const filename = page.slug === "index" ? "index.html" : `${page.slug}.html`;
      zip.file(filename, htmlContent);
    }

    // 3. Generate ZIP binary stream
    const zipBuffer = await zip.generateAsync({ type: "blob" });

    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}-export.zip"`,
      },
    });
  } catch (error: any) {
    console.error("Project export exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
