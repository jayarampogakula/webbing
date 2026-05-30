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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "html"; // html | react | nextjs

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
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Load dynamic CSS stylesheet definitions (glassmorphism, bento grid, animations)
    const customCssContent = `
/* Webbing Dynamic Style system */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #060914;
  --panel: #0d1323;
  --line: rgba(226, 232, 240, 0.12);
  --text: #f8fafc;
  --muted: #9aa7bd;
  --blue: #4f7cff;
  --teal: #20c7b5;
  --indigo: #6366f1;
}

body {
  margin: 0;
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.site-preview {
  min-height: 100vh;
}

/* Glassmorphism */
.glass-panel {
  background: rgba(13, 19, 35, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}
.bento-col-2 {
  grid-column: span 2;
}

@media (max-width: 900px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-col-2 {
    grid-column: span 1;
  }
}

/* Actions styling */
.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--indigo), var(--teal));
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
  transition: transform 0.2s;
}
.primary-action:hover {
  transform: translateY(-1px);
}

.secondary-action {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--line);
  color: var(--text);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 700;
  text-decoration: none;
}

/* Scroll Animations */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-on-scroll.active {
  opacity: 1;
  transform: translateY(0);
}
`;

    // ----------------------------------------------------
    // FORMAT 1: HTML / CSS / JS Static bundle
    // ----------------------------------------------------
    if (format === "html") {
      zip.file("style.css", customCssContent);
      zip.file("script.js", `
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
});
      `);

      for (const page of project.pages) {
        // Generate section HTML blocks based on type
        const sectionHtmlBlocks = page.sections.map((sec) => {
          const content = (sec.content as any) || {};
          const type = sec.type.toUpperCase();

          switch (type) {
            case "HEADER": {
              const links = content.links || [
                { label: "Features", url: "#features" },
                { label: "Pricing", url: "#pricing" },
                { label: "Contact", url: "#contact" }
              ];
              return `
  <header class="reveal-on-scroll active" style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 2rem; background: rgba(6, 9, 20, 0.4); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.06); position: sticky; top: 0; z-index: 50;">
    <a href="#" style="font-size: 1.25rem; font-weight: 800; color: #fff; text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
      <span style="padding: 0.25rem 0.5rem; border-radius: 0.40rem; background: linear-gradient(to right, #6366f1, #a855f7); color: #fff; font-size: 1rem;">W</span>
      ${project.name}
    </a>
    <nav style="display: flex; gap: 1.5rem;">
      ${links.map((link: any) => `<a href="${link.url}" style="color: #9ca3af; font-size: 0.9rem; font-weight: 500; text-decoration: none;">${link.label}</a>`).join("")}
    </nav>
    <a class="primary-action" href="${content.ctaUrl || "#contact"}" style="padding: 0.4rem 1rem; font-size: 0.85rem; border-radius: 0.4rem;">${content.ctaText || "Get Started"}</a>
  </header>`;
            }

            case "HERO": {
              return `
  <section class="reveal-on-scroll active" style="padding: 6rem 2rem; display: flex; justify-content: center; align-items: center;">
    <div style="width: 100%; maxWidth: 1100px; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 3rem; align-items: center; margin: 0 auto;">
      <div>
        <h1 style="font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 850; line-height: 1.05; margin: 1rem 0; color: #fff;">
          ${content.heading || page.title}
        </h1>
        <p style="color: #9ca3af; font-size: 1.15rem; line-height: 1.6; margin: 0 0 2rem 0; max-width: 600px;">
          ${content.subheading || page.description || ""}
        </p>
        <div style="display: flex; gap: 1rem;">
          <a class="primary-action" href="${content.ctaUrl || "#contact"}">${content.ctaText || "Contact Us"}</a>
        </div>
      </div>
      ${content.imageUrl ? `<img src="${content.imageUrl}" style="width: 100%; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />` : ""}
    </div>
  </section>`;
            }

            case "FEATURES": {
              const items = content.items || [];
              return `
  <section id="features" class="reveal-on-scroll" style="padding: 5rem 2rem; max-width: 1100px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
      ${items.map((item: any) => `
      <article class="glass-card" style="border-radius: 1rem; padding: 2rem; border: 1px solid rgba(255,255,255,0.06);">
        <h3 style="margin: 0 0 0.5rem 0; color: #fff; font-size: 1.25rem;">${item.title}</h3>
        <p style="color: #9ca3af; margin: 0; font-size: 0.95rem;">${item.description}</p>
      </article>`).join("")}
    </div>
  </section>`;
            }

            case "CONTACT": {
              return `
  <section id="contact" class="reveal-on-scroll" style="padding: 5rem 2rem; max-width: 1100px; margin: 0 auto;">
    <div class="glass-panel" style="padding: 3rem; border-radius: 1rem; text-align: center;">
      <h2 style="font-size: 2rem; color: #fff; margin: 0 0 1rem 0;">${content.heading || "Get In Touch"}</h2>
      <p style="color: #9ca3af; margin-bottom: 2rem;">Reach out directly to find out more about our plans and services.</p>
      <a class="primary-action" href="mailto:${content.email || "hello@example.com"}">${content.email || "hello@example.com"}</a>
    </div>
  </section>`;
            }

            default:
              return "";
          }
        }).join("\n");

        const htmlLayout = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title || project.name}</title>
  <meta name="description" content="${page.description || ''}">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="site-preview">
    ${sectionHtmlBlocks}
  </div>
  <script src="script.js"></script>
</body>
</html>`;

        const filename = page.slug === "index" ? "index.html" : `${page.slug}.html`;
        zip.file(filename, htmlLayout);
      }
    }

    // ----------------------------------------------------
    // FORMAT 2: REACT Folder structure
    // ----------------------------------------------------
    else if (format === "react") {
      zip.file("package.json", JSON.stringify({
        name: `${safeName}-react`,
        version: "1.0.0",
        scripts: {
          dev: "vite",
          build: "vite build"
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.331.0"
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.2.1",
          vite: "^5.1.0"
        }
      }, null, 2));

      zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`);

      zip.file("src/main.jsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

      zip.file("src/index.css", customCssContent);

      // Create a single simple App.jsx containing the dynamic render
      zip.file("src/App.jsx", `import React, { useEffect } from "react";
import { Star, Shield, Play, Globe, MessageSquare } from "lucide-react";

export default function App() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
  }, []);

  return (
    <div className="site-preview" style={{ minHeight: "100vh" }}>
      {/* Dynamic Sections rendering from Webbing */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <section className="reveal-on-scroll active" style={{ padding: "6rem 0", display: "flex", justifyContent: "center" }}>
          <div>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 850, color: "#fff" }}>${project.name}</h1>
            <p style={{ color: "#9ca3af", fontSize: "1.2rem" }}>${project.description || "Self-hosted Vite React application."}</p>
          </div>
        </section>
      </main>
    </div>
  );
}`);
    }

    // ----------------------------------------------------
    // FORMAT 3: NEXT.JS App Router structure
    // ----------------------------------------------------
    else if (format === "nextjs") {
      zip.file("package.json", JSON.stringify({
        name: `${safeName}-nextjs`,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        },
        dependencies: {
          next: "^14.1.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.331.0"
        }
      }, null, 2));

      zip.file("app/layout.tsx", `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${project.name}",
  description: "${project.description || ''}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`);

      zip.file("app/globals.css", customCssContent);

      zip.file("app/page.tsx", `import React from "react";

export default function Home() {
  return (
    <div className="site-preview" style={{ minHeight: "100vh" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "6rem 1.5rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "#fff" }}>${project.name}</h1>
        <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>${project.description || "Next.js website bundle."}</p>
      </main>
    </div>
  );
}`);
    }

    const zipBuffer = await zip.generateAsync({ type: "blob" });
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeName}-${format}-export.zip"`,
      },
    });
  } catch (error: any) {
    console.error("Project export exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
