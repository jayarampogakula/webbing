import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import PlanEditor from "./PlanEditor";
import LlmKeyManager from "../components/LlmKeyManager";
import AdminConsole from "./AdminConsole";
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
  let plans: any[] = [];
  let paymentRequests: any[] = [];
  let feedbacks: any[] = [];
  let upiId = "pogakula@ybl";

  try {
    const [dbUsers, dbProjects, dbSubscriptions, dbTotalTenants, dbLlmKeys, dbPlans, dbRequests, dbUpiSetting, dbFeedbacks] = await Promise.all([
      prisma.user.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.project.findMany({ include: { tenant: true, customDomain: true, user: true }, orderBy: { createdAt: "desc" } }),
      prisma.subscription.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.tenant.count(),
      getLlmKeys(),
      prisma.plan.findMany({ orderBy: { price: "asc" } }),
      prisma.paymentRequest.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.systemSetting.findUnique({ where: { key: "upiId" } }),
      prisma.feedback.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    users = dbUsers;
    projects = dbProjects;
    subscriptions = dbSubscriptions;
    totalTenants = dbTotalTenants;
    llmKeys = dbLlmKeys;
    plans = dbPlans;
    paymentRequests = dbRequests;
    feedbacks = dbFeedbacks;
    upiId = dbUpiSetting?.value || "pogakula@ybl";
  } catch (error) {
    console.error("Admin data load failed:", error);
    return (
      <div className="app-shell">
        <header className="site-nav">
          <a className="brand" href="/">
            <span className="brand-mark"><Sparkles size={18} /></span>
            Webbing
          </a>
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0e17" }}>
      <header className="site-nav" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", margin: 0, background: "rgba(10, 14, 23, 0.95)" }}>
        <a className="brand" href="/">
          <span className="brand-mark"><Sparkles size={18} /></span>
          Webbing
        </a>
        <div className="nav-actions">
          <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Admin: {user.email}</span>
          <a className="danger-action" href="/api/auth/signout">Sign out</a>
        </div>
      </header>

      <AdminConsole
        user={user}
        users={users}
        projects={projects}
        subscriptions={subscriptions}
        totalTenants={totalTenants}
        llmKeys={llmKeys}
        initialPlans={plans}
        initialRequests={paymentRequests}
        initialFeedbacks={feedbacks}
        initialUpiId={upiId}
        baseDomain={baseDomain}
        protocol={protocol}
      />
    </div>
  );
}
