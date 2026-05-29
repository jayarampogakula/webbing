import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import PlanEditor from "./PlanEditor";
import LlmKeyManager from "../components/LlmKeyManager";
import { Sparkles } from "lucide-react";

async function getLlmKeys() {
  try {
    return await prisma.llmApiKey.findMany({
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

export default async function AdminPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user || user.role !== "ADMIN") redirect("/signin");

  const hostHeader = headers().get("host") || "webbing.in";
  const baseDomain = hostHeader.startsWith("app.") ? hostHeader.slice(4) : hostHeader;
  const protocol = hostHeader.includes("localhost") ? "http" : "https";

  let users: any[] = [];
  let projects: any[] = [];
  let subscriptions: any[] = [];
  let totalTenants = 0;
  let llmKeys: Awaited<ReturnType<typeof getLlmKeys>> = [];

  try {
    [users, projects, subscriptions, totalTenants, llmKeys] = await Promise.all([
      prisma.user.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.project.findMany({ include: { tenant: true, customDomain: true }, orderBy: { createdAt: "desc" } }),
      prisma.subscription.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.tenant.count(),
      getLlmKeys(),
    ]);
  } catch (error) {
    console.error("Admin data load failed:", error);
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
            <a href="/admin">Admin</a>
          </nav>
          <div className="nav-actions">
            <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Admin: {user.email}</span>
            <a className="danger-action" href="/api/auth/signout">Sign out</a>
          </div>
        </header>
        <main className="app-main">
          <section className="surface-panel">
            <span className="eyebrow">Admin unavailable</span>
            <h1>Database schema is still syncing.</h1>
            <p style={{ color: "#9aa7bd" }}>
              The admin session is valid, but production database reads failed. Rebuild/restart the app
              container so the latest Prisma schema and seed can run.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalSites = projects.length;
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;

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
          <a href="/admin">Admin</a>
        </nav>
        <div className="nav-actions">
          <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Admin: {user.email}</span>
          <a className="danger-action" href="/api/auth/signout">Sign out</a>
        </div>
      </header>

      <main className="app-main">
        <div className="app-title">
          <div>
            <span className="eyebrow">Admin portal</span>
            <h1>System overview</h1>
            <p>Manage tenants, websites, subscription credits, and platform-level AI providers.</p>
          </div>
          <div className="metric-row">
            <div className="stat-tile"><strong>{totalUsers}</strong><span>users</span></div>
            <div className="stat-tile"><strong>{totalSites}</strong><span>websites</span></div>
            <div className="stat-tile"><strong>{totalTenants}</strong><span>tenants</span></div>
            <div className="stat-tile"><strong>{activeSubs}</strong><span>active plans</span></div>
          </div>
        </div>

        <LlmKeyManager
          initialKeys={llmKeys}
          canAddGlobal
          title="Admin LLM API keys"
          description="Add multiple global or user-owned keys for OpenAI, Gemini, Claude, DeepSeek, MiniMax, Kimi, OpenRouter, custom providers, and more."
        />

        <section className="surface-panel">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Users</span>
              <h2>User management</h2>
              <p>Workspace ownership and roles across the platform.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Workspace</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="status-pill">{u.role}</span></td>
                    <td>{u.tenant.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface-panel" style={{ marginTop: "2rem" }}>
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Websites</span>
              <h2>Generated websites</h2>
              <p>All generated projects and publishing status.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Site</th><th>Subdomain</th><th>Status</th><th>Workspace</th></tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const subdomainUrl = `${protocol}://${p.subdomain}.${baseDomain}`;
                  const hasCustomDomain = p.customDomain && p.customDomain.hostname;
                  const customDomainUrl = hasCustomDomain ? `${protocol}://${p.customDomain.hostname}` : null;
                  const projectUrl = p.selfHosted
                    ? null
                    : (hasCustomDomain && p.customDomain.verified ? customDomainUrl : subdomainUrl);

                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                          {p.selfHosted ? (
                            <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Self-Hosted / External</span>
                          ) : (
                            <>
                              <a href={projectUrl || "#"} target="_blank" rel="noopener noreferrer">
                                {p.subdomain}.{baseDomain}
                              </a>
                              {hasCustomDomain && (
                                <span style={{ fontSize: "0.75rem", color: p.customDomain.verified ? "#34d399" : "#f87171" }}>
                                  Domain: {p.customDomain.hostname} {p.customDomain.verified ? "(Verified)" : "(Unverified)"}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td><span className="status-pill">{p.status}</span></td>
                      <td>{p.tenant.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface-panel" style={{ marginTop: "2rem" }}>
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Plans</span>
              <h2>Subscription credit quotas</h2>
              <p>Adjust tenant credit limits without leaving the admin panel.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Workspace</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Used</th>
                  <th>Limit</th>
                  <th>AI / LLM</th>
                  <th>Hosting</th>
                  <th>Domain</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.tenant.name}</strong></td>
                    <td style={{ textTransform: "capitalize" }}>{s.planId.replace("-", " ")}</td>
                    <td><span className="status-pill">{s.status}</span></td>
                    <td>{s.creditsUsed} credits</td>
                    <td><strong>{s.creditsLimit} credits</strong></td>
                    <td>
                      {s.withLlm ? (
                        <span style={{ color: "#34d399", fontWeight: 600 }}>Enabled</span>
                      ) : (
                        <span style={{ color: "#f87171", fontWeight: 600 }}>Disabled</span>
                      )}
                    </td>
                    <td>
                      {s.hostingType === "OURS" && "Our Hosting"}
                      {s.hostingType === "THEIRS" && "Own Hosting"}
                      {s.hostingType === "BOTH" && "Both options"}
                    </td>
                    <td>
                      {s.domainType === "SUBDOMAIN" && "Subdomain Only"}
                      {s.domainType === "CUSTOM" && "Custom Domain"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <PlanEditor
                        tenantId={s.tenantId}
                        initialPlanId={s.planId}
                        initialLimit={s.creditsLimit}
                        initialWithLlm={s.withLlm}
                        initialHostingType={s.hostingType}
                        initialDomainType={s.domainType}
                        initialStatus={s.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
