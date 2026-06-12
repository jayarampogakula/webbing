import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { checkSetupAndLicense } from "@/lib/licensing";
import DashboardEditor from "./DashboardEditor";
import { Sparkles } from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

async function getLlmKeys(userId: string) {
  try {
    return await prisma.llmApiKey.findMany({
      where: {
        scope: "USER",
        ownerUserId: userId,
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
  const reqHost = headers().get("x-forwarded-host") || headers().get("host") || "";
  const { setupRequired, licenseValid } = await checkSetupAndLicense(reqHost);
  if (setupRequired || !licenseValid) {
    redirect("/setup");
  }

  const sessionToken = cookies().get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user) redirect("/signin");

  const hostHeader = headers().get("host") || "webbing.in";
  const baseDomain = hostHeader.startsWith("app.") ? hostHeader.slice(4) : hostHeader;
  const protocol = hostHeader.includes("localhost") ? "http" : "https";

  let tenant = null;
  let llmKeys: Awaited<ReturnType<typeof getLlmKeys>> = [];
  let plans: any[] = [];
  let upiId = "pogakula@ybl";
  let dbUserObj = null;
  let systemSettings: any = null;

  try {
    const [dbTenant, dbLlmKeys, dbPlans, dbUpiSetting, dbUser, dbSettings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: {
          subscription: true,
          projects: {
            where: user.role === "ADMIN" ? undefined : {
              OR: [
                { userId: user.userId },
                { userId: null }
              ]
            },
            include: {
              customDomain: true,
              contactSubmissions: {
                orderBy: { createdAt: "desc" }
              },
              pages: {
                include: {
                  sections: { orderBy: { order: "asc" } }
                }
              }
            },
            orderBy: { createdAt: "desc" }
          },
        },
      }),
      getLlmKeys(user.userId),
      prisma.plan.findMany({ orderBy: { price: "asc" } }),
      prisma.systemSetting.findUnique({ where: { key: "upiId" } }),
      prisma.user.findUnique({ where: { id: user.userId } }),
      getSystemSettings(),
      prisma.systemSetting.findMany({
        where: { key: { startsWith: "yearlyDiscount_" } }
      })
    ]);
    tenant = dbTenant;
    llmKeys = dbLlmKeys;
    const discountMap = Object.fromEntries((dbDiscounts || []).map((s: any) => [s.key, s.value]));
    plans = dbPlans.map((p: any) => ({
      ...p,
      yearlyDiscount: parseInt(discountMap[`yearlyDiscount_${p.id}`] || "0", 10)
    }));
    upiId = dbUpiSetting?.value || "pogakula@ybl";
    dbUserObj = dbUser;
    systemSettings = dbSettings;

    // Auto-generate affiliateCode if missing
    if (dbUserObj && !dbUserObj.affiliateCode) {
      const namePart = dbUserObj.name?.trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "USER";
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `${namePart}${randomSuffix}`;
      try {
        const updatedUser = await prisma.user.update({
          where: { id: dbUserObj.id },
          data: { affiliateCode: generatedCode }
        });
        dbUserObj = updatedUser;
      } catch (dbErr) {
        console.error("Failed to auto-generate and save affiliate code for user:", dbErr);
      }
    }
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    return (
      <div className="app-shell">
        <header className="site-nav">
          <a className="brand" href="/">
            <span className="brand-mark"><Sparkles size={18} /></span>
            Webbing
          </a>
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

  const mergedUser = { ...user, ...dbUserObj };

  return (
    <DashboardEditor
      user={mergedUser as any}
      tenant={tenant as any}
      baseDomain={baseDomain}
      protocol={protocol}
      initialPlans={plans}
      upiId={upiId}
      initialSettings={systemSettings}
    />
  );
}
