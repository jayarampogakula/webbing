import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import GeneratorForm from "../GeneratorForm";
import LlmKeyManager from "../components/LlmKeyManager";
import { Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user) redirect("/signin");

  const [tenant, llmKeys] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { subscription: true, projects: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.llmApiKey.findMany({
      where: {
        OR: [
          { scope: "GLOBAL", isActive: true },
          { scope: "USER", ownerUserId: user.userId },
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
    }),
  ]);

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
              <p>Track build status and open published subdomains.</p>
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
                    <th>Subdomain</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.projects.map((project) => (
                    <tr key={project.id}>
                      <td><strong>{project.name}</strong></td>
                      <td><code>{project.subdomain}.localhost:3000</code></td>
                      <td><span className="status-pill">{project.status}</span></td>
                      <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                      <td>
                        {project.status === "PUBLISHED" ? (
                          <a className="secondary-action" href={`http://${project.subdomain}.localhost:3000`} target="_blank" rel="noopener noreferrer">Visit</a>
                        ) : (
                          <span style={{ color: "#9aa7bd" }}>{project.status === "GENERATING" ? "Building" : "Pending"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
