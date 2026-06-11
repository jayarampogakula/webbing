import { NextResponse } from "next/server";
import { prisma, Role, LlmKeyScope, SubscriptionStatus } from "@webbing/db";
import { hashPassword, verifyPassword } from "@webbing/db";

async function isSetupRequired() {
  try {
    // 1. Check if default admin user is still using default credentials
    const defaultAdmin = await prisma.user.findUnique({
      where: { email: "admin@webbing.in" }
    });

    if (defaultAdmin && defaultAdmin.passwordHash) {
      const isDefaultPassword = verifyPassword("Admin123", defaultAdmin.passwordHash);
      if (isDefaultPassword) {
        return true;
      }
    }

    // 2. Check if there are any ADMIN role users configured in the DB
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN }
    });

    if (adminCount === 0) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Setup check query error:", err);
    return false;
  }
}

export async function GET() {
  const required = await isSetupRequired();
  return NextResponse.json({ setupRequired: required });
}

export async function POST(req: Request) {
  const required = await isSetupRequired();
  if (!required) {
    return NextResponse.json({ error: "SaaS setup has already been completed. For modifications, please log in and navigate to the Admin Console." }, { status: 403 });
  }

  try {
    const { appName, adminEmail, adminPassword, adminName } = await req.json();

    if (!appName || !adminEmail || !adminPassword || !adminName) {
      return NextResponse.json({ error: "All configuration details are required (SaaS Name, Admin Name, Email, Password)." }, { status: 400 });
    }

    const emailClean = adminEmail.trim().toLowerCase();
    const nameClean = adminName.trim();
    const passwordHash = hashPassword(adminPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Get or create Admin Tenant
      let adminTenant = await tx.tenant.findUnique({ where: { slug: "admin" } });
      if (!adminTenant) {
        adminTenant = await tx.tenant.create({
          data: {
            name: "Admin Team",
            slug: "admin",
          }
        });
      }

      // 2. Update or create the administrator user
      const defaultAdmin = await tx.user.findUnique({ where: { email: "admin@webbing.in" } });
      if (defaultAdmin) {
        // Upgrade default admin account details
        await tx.user.update({
          where: { email: "admin@webbing.in" },
          data: {
            email: emailClean,
            name: nameClean,
            passwordHash,
            role: Role.ADMIN,
            tenantId: adminTenant.id
          }
        });
      } else {
        // Create new admin user
        await tx.user.upsert({
          where: { email: emailClean },
          update: {
            name: nameClean,
            passwordHash,
            role: Role.ADMIN,
            tenantId: adminTenant.id
          },
          create: {
            email: emailClean,
            name: nameClean,
            passwordHash,
            role: Role.ADMIN,
            tenantId: adminTenant.id
          }
        });
      }

      // Ensure Admin subscription exists
      await tx.subscription.upsert({
        where: { tenantId: adminTenant.id },
        update: {},
        create: {
          tenantId: adminTenant.id,
          planId: "agency-plan",
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          creditsLimit: 500,
          creditsUsed: 0,
          withLlm: true,
          hostingType: "BOTH",
          domainType: "CUSTOM",
        }
      });

      // 3. Upsert System settings for App configuration
      await tx.systemSetting.upsert({
        where: { key: "appName" },
        update: { value: appName },
        create: { key: "appName", value: appName }
      });

      await tx.systemSetting.upsert({
        where: { key: "appEmail" },
        update: { value: emailClean },
        create: { key: "appEmail", value: emailClean }
      });
    });

    return NextResponse.json({ success: true, message: "SaaS platform configuration completed successfully!" });
  } catch (error: any) {
    console.error("SaaS platform configuration failure:", error);
    return NextResponse.json({ error: error.message || "Failed to finalize SaaS configuration setup settings." }, { status: 500 });
  }
}
