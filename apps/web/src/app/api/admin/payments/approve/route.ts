import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, SubscriptionStatus } from "@webbing/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action (APPROVE/REJECT) are required." }, { status: 400 });
    }

    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "This request has already been processed." }, { status: 400 });
    }

    if (action === "REJECT") {
      const updated = await prisma.paymentRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      return NextResponse.json({ success: true, message: "Request rejected.", request: updated });
    }

    if (action === "APPROVE") {
      // 1. Check if this is an extra credits purchase request
      const isCreditsPurchase = request.planId.startsWith("credits-");
      if (isCreditsPurchase) {
        const match = request.planId.match(/credits-(\d+)/);
        const creditCount = match ? parseInt(match[1], 10) : 0;

        if (creditCount <= 0) {
          return NextResponse.json({ error: "Invalid credit count requested." }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
          const updatedReq = await tx.paymentRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED" }
          });

          // Fetch current subscription
          const sub = await tx.subscription.findUnique({
            where: { tenantId: request.tenantId }
          });

          const currentLimit = sub?.creditsLimit || 0;
          const updatedSub = await tx.subscription.update({
            where: { tenantId: request.tenantId },
            data: {
              creditsLimit: currentLimit + creditCount
            }
          });

          return { request: updatedReq, subscription: updatedSub };
        });

        return NextResponse.json({
          success: true,
          message: `Approved successfully! Added ${creditCount} credits to user account. 🎉`,
          ...result
        });
      }

      // 2. Regular plan upgrade lookup (handling annual billing variations)
      const cleanPlanId = request.planId.replace("-annual", "");
      let lookupName = cleanPlanId;
      if (cleanPlanId === "pro-plan") lookupName = "Pro Plan";
      else if (cleanPlanId === "agency") lookupName = "Agency";
      else if (cleanPlanId === "starter") lookupName = "Starter";

      const plan = await prisma.plan.findUnique({
        where: { name: lookupName }
      });

      if (!plan) {
        return NextResponse.json({ error: `Configured plan '${request.planId}' details not found in system. Add this plan first.` }, { status: 404 });
      }

      // Start database transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Approve Payment Request
        const updatedReq = await tx.paymentRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" }
        });

        // 2. Upgrade Tenant Subscription
        const sub = await tx.subscription.upsert({
          where: { tenantId: request.tenantId },
          update: {
            planId: plan.name.toLowerCase().replace(/\s+/g, "-"),
            status: SubscriptionStatus.ACTIVE,
            creditsLimit: plan.creditsLimit,
            creditsUsed: 0, // Reset credits used
            withLlm: true,
            hostingType: "BOTH",
            domainType: "CUSTOM" // Grant custom domain capabilities
          },
          create: {
            tenantId: request.tenantId,
            planId: plan.name.toLowerCase().replace(/\s+/g, "-"),
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            creditsLimit: plan.creditsLimit,
            creditsUsed: 0,
            withLlm: true,
            hostingType: "BOTH",
            domainType: "CUSTOM"
          }
        });

        return { request: updatedReq, subscription: sub };
      });

      return NextResponse.json({
        success: true,
        message: "Payment approved and subscription upgraded successfully! 🎉",
        ...result
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST Approve Payment Exception:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
