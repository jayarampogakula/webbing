import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, SubscriptionStatus } from "@webbing/db";
import { verifySession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has an active paid subscription eligible for refund
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (!sub || sub.planId === "free-plan") {
      return NextResponse.json({ eligible: false, message: "No active paid plan found." });
    }

    // Find the latest approved PaymentRequest
    const latestPayReq = await prisma.paymentRequest.findFirst({
      where: { tenantId: user.tenantId, status: "APPROVED", NOT: { planId: { startsWith: "credits-" } } },
      orderBy: { updatedAt: "desc" }
    });

    if (!latestPayReq) {
      return NextResponse.json({ eligible: false, message: "No approved plan purchase record found." });
    }

    const diffMs = Date.now() - new Date(latestPayReq.updatedAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 10) {
      return NextResponse.json({ eligible: false, message: "Refund window of 10 days has expired." });
    }

    // Check if already refunded or pending refund
    const existingRefund = await prisma.refundRequest.findUnique({
      where: { paymentRequestId: latestPayReq.id }
    });

    if (existingRefund) {
      return NextResponse.json({ eligible: false, message: `Refund is already ${existingRefund.status.toLowerCase()}.` });
    }

    // Calculate credit deduction
    const creditsUsed = sub.creditsUsed;
    const creditsLimit = sub.creditsLimit || 10;
    const amountPaid = latestPayReq.amount;
    const costPerCredit = amountPaid / creditsLimit;
    const deductAmount = Math.round(creditsUsed * costPerCredit);
    const refundAmount = Math.max(0, amountPaid - deductAmount);

    return NextResponse.json({
      eligible: true,
      daysRemaining: Math.max(0, Math.ceil(10 - diffDays)),
      amountPaid,
      creditsUsed,
      deductAmount,
      refundAmount,
      paymentRequestId: latestPayReq.id
    });

  } catch (error: any) {
    console.error("GET Refund Eligibility Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (!sub || sub.planId === "free-plan") {
      return NextResponse.json({ error: "No active paid plan found." }, { status: 400 });
    }

    const latestPayReq = await prisma.paymentRequest.findFirst({
      where: { tenantId: user.tenantId, status: "APPROVED", NOT: { planId: { startsWith: "credits-" } } },
      orderBy: { updatedAt: "desc" }
    });

    if (!latestPayReq) {
      return NextResponse.json({ error: "No approved plan purchase record found." }, { status: 400 });
    }

    const diffMs = Date.now() - new Date(latestPayReq.updatedAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 10) {
      return NextResponse.json({ error: "Refund period of 10 days has expired." }, { status: 400 });
    }

    const existingRefund = await prisma.refundRequest.findUnique({
      where: { paymentRequestId: latestPayReq.id }
    });

    if (existingRefund) {
      return NextResponse.json({ error: `Refund request already exists with status: ${existingRefund.status}.` }, { status: 400 });
    }

    // Calculate credit deduction
    const creditsUsed = sub.creditsUsed;
    const creditsLimit = sub.creditsLimit || 10;
    const amountPaid = latestPayReq.amount;
    const costPerCredit = amountPaid / creditsLimit;
    const deductAmount = Math.round(creditsUsed * costPerCredit);
    const refundAmount = Math.max(0, amountPaid - deductAmount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Request
      const refund = await tx.refundRequest.create({
        data: {
          tenantId: user.tenantId,
          paymentRequestId: latestPayReq.id,
          amountPaid,
          creditsUsed,
          refundAmount,
          status: "PENDING"
        }
      });

      // 2. Invalidate Referrer Commission if any
      await tx.affiliateCommission.updateMany({
        where: { paymentRequestId: latestPayReq.id },
        data: { status: "CANCELLED" }
      });

      // 3. Downgrade Subscription to Free
      await tx.subscription.update({
        where: { tenantId: user.tenantId },
        data: {
          planId: "free-plan",
          status: SubscriptionStatus.CANCELED,
          creditsLimit: 3,
          creditsUsed: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });

      return refund;
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled. Your refund request of ₹" + refundAmount.toLocaleString() + " is pending administrative approval.",
      refund: result
    });

  } catch (error: any) {
    console.error("POST Cancel/Refund Request Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
