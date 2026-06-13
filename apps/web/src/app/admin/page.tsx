import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { checkSetupAndLicense } from "@/lib/licensing";
import PlanEditor from "./PlanEditor";
import LlmKeyManager from "../components/LlmKeyManager";
import AdminConsole from "./AdminConsole";
import { Sparkles } from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

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
  const reqHost = headers().get("x-forwarded-host") || headers().get("host") || "";
  const { setupRequired, licenseValid } = await checkSetupAndLicense(reqHost);
  if (setupRequired || !licenseValid) {
    redirect("/setup");
  }

  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user || user.role !== "ADMIN") redirect("/signin");

  const hostHeader = headers().get("host") || "webbing.in";
  const baseDomain = hostHeader.startsWith("app.") ? hostHeader.slice(4) : hostHeader;
  const protocol = hostHeader.includes("localhost") ? "http" : "https";
  const isCursorWebs = baseDomain.toLowerCase().includes("cursonwebs") || baseDomain.toLowerCase().includes("cursorwebs");
  const fallbackAppName = isCursorWebs ? "CursorWebs" : "Webbing";

  let users: any[] = [];
  let projects: any[] = [];
  let subscriptions: any[] = [];
  let totalTenants = 0;
  let llmKeys: Awaited<ReturnType<typeof getLlmKeys>> = [];
  let plans: any[] = [];
  let paymentRequests: any[] = [];
  let feedbacks: any[] = [];
  let upiId = "pogakula@ybl";
  let payoutRequests: any[] = [];
  let refundRequests: any[] = [];
  let systemSettings: any = null;

  try {
    const [dbUsers, dbProjects, dbSubscriptions, dbTotalTenants, dbLlmKeys, dbPlans, dbRequests, dbSettings, dbFeedbacks, dbPayouts, dbRefunds, dbDiscounts] = await Promise.all([
      prisma.user.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.project.findMany({ include: { tenant: true, customDomain: true, user: true }, orderBy: { createdAt: "desc" } }),
      prisma.subscription.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      prisma.tenant.count(),
      getLlmKeys(),
      prisma.plan.findMany({ orderBy: { price: "asc" } }),
      prisma.paymentRequest.findMany({ include: { tenant: true }, orderBy: { createdAt: "desc" } }),
      getSystemSettings(reqHost),
      prisma.feedback.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.payoutRequest.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
      prisma.refundRequest.findMany({ include: { tenant: true, paymentRequest: true }, orderBy: { createdAt: "desc" } }),
      prisma.systemSetting.findMany({ where: { key: { startsWith: "yearlyDiscount_" } } })
    ]);
    users = dbUsers;
    projects = dbProjects;
    subscriptions = dbSubscriptions;
    totalTenants = dbTotalTenants;
    llmKeys = dbLlmKeys;
    const discountMap = Object.fromEntries((dbDiscounts || []).map((s: any) => [s.key, s.value]));
    plans = dbPlans.map((p: any) => ({
      ...p,
      yearlyDiscount: parseInt(discountMap[`yearlyDiscount_${p.id}`] || "0", 10)
    }));
    paymentRequests = dbRequests;
    systemSettings = dbSettings;
    feedbacks = dbFeedbacks;
    upiId = dbSettings.upiId || "pogakula@ybl";
    payoutRequests = dbPayouts;
    refundRequests = dbRefunds;
  } catch (error) {
    console.error("Admin data load failed:", error);
    return (
      <div className="app-shell">
        <header className="site-nav">
          <a className="brand" href="/">
            <span className="brand-mark"><Sparkles size={18} /></span>
            {systemSettings?.appName || fallbackAppName}
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

      const isMasterDomain = baseDomain.toLowerCase() === "webbing.in" || baseDomain.toLowerCase() === "cursorwebs.com" || baseDomain.toLowerCase() === "cursonwebs.com" || baseDomain.toLowerCase().includes("localhost");
      const isWebbingIn = baseDomain.toLowerCase() === "webbing.in";
      const enableLicenseGenerator = isWebbingIn || ((process.env.ENABLE_LICENSE_GENERATOR === "true" || process.env.NODE_ENV === "development") && isMasterDomain);

      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
          <header className="site-nav" style={{ borderBottom: "1px solid var(--line)", margin: 0, background: "var(--panel)" }}>
            <a className="brand" href="/">
              <span className="brand-mark"><Sparkles size={18} /></span>
              {systemSettings?.appName || fallbackAppName}
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
            initialPayouts={payoutRequests}
            initialRefunds={refundRequests}
            baseDomain={baseDomain}
            protocol={protocol}
            initialSettings={systemSettings}
            enableLicenseGenerator={enableLicenseGenerator}
          />
        </div>
      );
}
