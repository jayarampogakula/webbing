import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, SubscriptionStatus } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { sendPlanActivationEmail, sendCreditsPurchaseEmail } from "@/lib/mail";
import { getSystemSettings } from "@/lib/settings";


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

    // Fetch the primary user of this tenant to notify
    const tenantUser = await prisma.user.findFirst({
      where: { tenantId: request.tenantId },
      orderBy: { createdAt: "asc" }
    });


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

        // Send credit purchase confirmation email asynchronously
        if (tenantUser) {
          sendCreditsPurchaseEmail(tenantUser.email, tenantUser.name || "User", creditCount, request.amount).catch((err) => {
            console.error("Failed to send credit purchase success email:", err);
          });
        }

        return NextResponse.json({
          success: true,
          message: `Approved successfully! Added ${creditCount} credits to user account. 🎉`,
          ...result
        });
      }

      // 2. Regular plan upgrade lookup (handling annual billing variations)
      const cleanPlanId = request.planId.replace("-annual", "");
      let lookupName = cleanPlanId;
      if (cleanPlanId === "individual" || cleanPlanId === "individual-plan") lookupName = "Individual Plan";
      else if (cleanPlanId === "pro-plan") lookupName = "Pro Plan";
      else if (cleanPlanId === "agency") lookupName = "Agency";
      else if (cleanPlanId === "starter") lookupName = "Starter";

      const plan = await prisma.plan.findUnique({
        where: { name: lookupName }
      });

      if (!plan) {
        return NextResponse.json({ error: `Configured plan '${request.planId}' details not found in system. Add this plan first.` }, { status: 404 });
      }

      // Fetch system settings
      const settings = await getSystemSettings();

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
        
        // 3. Create Affiliate Commission if referred
        const payingUser = await tx.user.findFirst({
          where: { tenantId: request.tenantId },
          orderBy: { createdAt: "asc" }
        });

        if (payingUser && payingUser.referredBy && settings.affiliateEnabled === "true") {
          // Check if referrer user is paid
          const referrerUser = await tx.user.findUnique({
            where: { id: payingUser.referredBy }
          });
          const referrerSub = referrerUser ? await tx.subscription.findUnique({
            where: { tenantId: referrerUser.tenantId }
          }) : null;
          const referrerIsPaid = referrerSub && referrerSub.status === "ACTIVE" && referrerSub.planId !== "free-plan" && referrerSub.planId !== "starter";

          if (referrerIsPaid) {
            const planKey = plan.name.toLowerCase().replace(/\s+/g, "-");
            if (planKey !== "starter" && !request.planId.startsWith("credits-")) {
              // Check if there are any existing non-cancelled commissions for this referee
              const previousCommission = await tx.affiliateCommission.findFirst({
                where: {
                  refereeId: payingUser.id,
                  status: { not: "CANCELLED" }
                }
              });

              // Fetch dynamic tier parameters
              const t1Max = parseInt(settings.affiliateTier1Max || "10", 10);
              const t2Max = parseInt(settings.affiliateTier2Max || "50", 10);
              const t1Rate = parseFloat(settings.affiliateTier1Rate || "20") / 100.0;
              const t2Rate = parseFloat(settings.affiliateTier2Rate || "25") / 100.0;
              const t3Rate = parseFloat(settings.affiliateTier3Rate || "30") / 100.0;
              const recRate = parseFloat(settings.affiliateRecurringRate || "10") / 100.0;

              let rate = recRate;
              if (!previousCommission) {
                // Count unique referee IDs that have non-cancelled commissions for this referrer
                const matureReferralsCount = await tx.affiliateCommission.groupBy({
                  by: ['refereeId'],
                  where: {
                    referrerId: payingUser.referredBy,
                    status: { not: "CANCELLED" }
                  }
                });
                const referralCount = matureReferralsCount.length;

                if (referralCount < t1Max) {
                  rate = t1Rate;
                } else if (referralCount < t2Max) {
                  rate = t2Rate;
                } else {
                  rate = t3Rate;
                }
              }

              const commissionAmount = Math.round(request.amount * rate);
              const availableDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

              await tx.affiliateCommission.create({
                data: {
                  referrerId: payingUser.referredBy,
                  refereeId: payingUser.id,
                  amount: commissionAmount,
                  paymentRequestId: requestId,
                  status: "PENDING",
                  availableAt: availableDate
                }
              });
            }
          }
        }

        return { request: updatedReq, subscription: sub };
      });

      // Send plan activation confirmation email asynchronously
      if (tenantUser) {
        sendPlanActivationEmail(tenantUser.email, tenantUser.name || "User", plan.name).catch((err) => {
          console.error("Failed to send plan activation success email:", err);
        });
      }

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
