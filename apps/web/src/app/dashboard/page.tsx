import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import GeneratorForm from "../GeneratorForm";
import LlmKeyManager from "../components/LlmKeyManager";
import ProjectSettingsModal from "./ProjectSettingsModal";
import { Sparkles } from "lucide-react";

async function getLlmKeys(userId: string) {
  try {
    return await prisma.llmApiKey.findMany({
      where: {
        OR: [
          { scope: "GLOBAL", isActive: true },
          { scope: "USER", ownerUserId: userId },
        ],
      },
      orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        provider: true,
        label: true,
        maskedKey: true,
        baseUrl: true,
        model: true,
        scope: true,
        ownerUserId: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("LLM key table is not ready yet:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user) redirect("/signin");

  const hostHeader = headers().get("host") || "webbing.in";
  const baseDomain = hostHeader.startsWith("app.") ? hostHeader.slice(4) : hostHeader;
  const protocol = hostHeader.includes("localhost") ? "http" : "https";

  let tenant = null;
  let llmKeys: Awaited<ReturnType<typeof getLlmKeys>> = [];

  try {
    [tenant, llmKeys] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: {
          subscription: true,
          projects: { include: { customDomain: true }, orderBy: { createdAt: "desc" } },
        },
      }),
      getLlmKeys(user.userId),
    ]);
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    return (
      <div className="app-shell">
        <header className="site-nav">
          <a className="brand" href="/">
            <span className="brand-mark"><Sparkles size={18} /></span>
            Webbing
          </a>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            {user.role === "ADMIN" && <a href="/admin">Admin</a>}
          </nav>
          <div className="nav-actions">
            <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
            <a className="danger-action" href="/api/auth/signout">Sign out</a>
          </div>
        </header>
        <main className="app-main">
          <section className="surface-panel">
            <span className="eyebrow">Dashboard unavailable</span>
            <h1>Database schema is still syncing.</h1>
            <p style={{ color: "#9aa7bd" }}>
              Your login worked, but the dashboard data could not be read from the production database yet.
              Rebuild/restart the app container so the entrypoint can run the latest Prisma schema sync.
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (!tenant) {
    return <div className="app-shell"><main className="app-main"><div className="form-alert">Workspace not found. Please contact support.</div></main></div>;
  }

  const totalCredits = tenant.subscription?.creditsLimit || 0;
  const usedCredits = tenant.subscription?.creditsUsed || 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  return (
    <div className="app-shell">
      <header className="site-nav">
        <a className="brand" href="/">
          <span className="brand-mark"><Sparkles size={18} /></span>
          Webbing
        </a>
        <nav className="nav-links">
          <a href="/">Home</a>
          <a href="/dashboard">Dashboard</a>
          {user.role === "ADMIN" && <a href="/admin">Admin</a>}
        </nav>
        <div className="nav-actions">
          <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>{user.email}</span>
          <a className="danger-action" href="/api/auth/signout">Sign out</a>
        </div>
      </header>

      <main className="app-main">
        <div className="app-title">
          <div>
            <span className="eyebrow">Workspace</span>
            <h1>{tenant.name}</h1>
            <p>Generate websites, monitor quota, and connect your own AI providers.</p>
          </div>
          <div className="metric-row">
            <div className="stat-tile"><strong>{usedCredits}</strong><span>credits used</span></div>
            <div className="stat-tile"><strong>{remainingCredits}</strong><span>remaining of {totalCredits}</span></div>
          </div>
        </div>

        <GeneratorForm user={user} />

        <LlmKeyManager
          initialKeys={llmKeys}
          title="Your LLM API keys"
          description="Add personal keys for OpenAI, Gemini, Claude, DeepSeek, MiniMax, Kimi, and other providers. Admin global keys are visible here when active."
        />

        <section className="surface-panel">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Generated websites</span>
              <h2>My websites ({tenant.projects.length})</h2>
              <p>Track hosting, customize custom domains, or export source bundle code.</p>
            </div>
          </div>
          {tenant.projects.length === 0 ? (
            <div className="empty-state">No websites yet. Generate your first project above.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Hosting & URL</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.projects.map((project) => {
                    const subdomainUrl = `${protocol}://${project.subdomain}.${baseDomain}`;
                    const customDomain = project.customDomain;
                    const hasCustomDomain = customDomain && customDomain.hostname;
                    const customDomainUrl = hasCustomDomain ? `${protocol}://${customDomain.hostname}` : null;
                    const projectUrl = project.selfHosted
                      ? null
                      : (customDomain && hasCustomDomain && customDomain.verified ? customDomainUrl : subdomainUrl);

                    return (
                      <tr key={project.id}>
                        <td><strong>{project.name}</strong></td>
                        <td>
                          {project.selfHosted ? (
                            <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Self-Hosted / External</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                              <code>{project.subdomain}.{baseDomain}</code>
                              {customDomain && hasCustomDomain && (
                                <span style={{ fontSize: "0.75rem", color: customDomain.verified ? "#34d399" : "#f87171" }}>
                                  Domain: {customDomain.hostname} {customDomain.verified ? "(Verified)" : "(Unverified)"}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td><span className="status-pill">{project.status}</span></td>
                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {project.status === "PUBLISHED" ? (
                              project.selfHosted ? (
                                <span style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 600 }}>Self-Hosted</span>
                              ) : (
                                <a className="secondary-action" href={projectUrl || "#"} target="_blank" rel="noopener noreferrer">Visit</a>
                              )
                            ) : (
                              <span style={{ color: "#9aa7bd" }}>{project.status === "GENERATING" ? "Building" : "Pending"}</span>
                            )}
                            <ProjectSettingsModal
                              projectId={project.id}
                              projectName={project.name}
                              subdomain={project.subdomain}
                              currentCustomDomain={project.customDomain?.hostname || null}
                              currentSelfHosted={project.selfHosted}
                              subscriptionDomainType={tenant.subscription?.domainType || "SUBDOMAIN"}
                              subscriptionHostingType={tenant.subscription?.hostingType || "OURS"}
                              baseDomain={baseDomain}
                              protocol={protocol}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
