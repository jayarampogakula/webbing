import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, SubscriptionStatus } from "@webbing/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { tenantId, planId, status, creditsLimit, withLlm, hostingType, domainType } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // 2. Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found for this tenant" }, { status: 404 });
    }

    // 3. Update subscription fields
    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: {
        planId: planId ?? subscription.planId,
        status: (status as SubscriptionStatus) ?? subscription.status,
        creditsLimit: creditsLimit !== undefined ? parseInt(String(creditsLimit), 10) : subscription.creditsLimit,
        withLlm: withLlm !== undefined ? !!withLlm : subscription.withLlm,
        hostingType: hostingType ?? subscription.hostingType,
        domainType: domainType ?? subscription.domainType,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription successfully updated",
      subscription: updated,
    });
  } catch (error: any) {
    console.error("Admin Subscription Management API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
