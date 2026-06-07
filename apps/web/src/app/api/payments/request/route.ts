import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { sendPaymentRequestEmail } from "@/lib/mail";
import { getSystemSettings } from "@/lib/settings";


// GET: List payment requests
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requests;
    if (user.role === "ADMIN") {
      requests = await prisma.paymentRequest.findMany({
        include: { tenant: true },
        orderBy: { createdAt: "desc" }
      });
    } else {
      requests = await prisma.paymentRequest.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("GET Payment Requests Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit a payment verification request
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, amount, utr } = await req.json();

    if (!planId || !amount || !utr) {
      return NextResponse.json({ error: "Plan ID, amount, and UTR transaction ID are required." }, { status: 400 });
    }

    // Resolve expected price
    const cleanPlanId = planId.replace("-annual", "");
    let lookupName = cleanPlanId;
    if (cleanPlanId === "individual" || cleanPlanId === "individual-plan") lookupName = "Individual Plan";
    else if (cleanPlanId === "pro-plan") lookupName = "Pro Plan";
    else if (cleanPlanId === "agency") lookupName = "Agency";
    else if (cleanPlanId === "starter") lookupName = "Starter";

    let expectedAmount = 0;
    if (planId.startsWith("credits-")) {
      const match = planId.match(/credits-(\d+)/);
      const count = match ? parseInt(match[1], 10) : 0;
      if (count === 10) expectedAmount = 99;
      else if (count === 50) expectedAmount = 399;
      else if (count === 100) expectedAmount = 699;
    } else {
      const plan = await prisma.plan.findUnique({
        where: { name: lookupName }
      });
      if (plan) {
        expectedAmount = plan.price;
        if (planId.endsWith("-annual")) {
          if (cleanPlanId === "individual" || cleanPlanId === "individual-plan") expectedAmount = 2040;
          else if (cleanPlanId === "pro-plan") expectedAmount = 6468;
          else if (cleanPlanId === "agency") expectedAmount = 25488;
        }
      }
    }

    // Verify discount if user has a referrer
    const dbUserReferrer = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { referredBy: true }
    });

    if (dbUserReferrer?.referredBy && expectedAmount > 0) {
      const settings = await getSystemSettings();
      if (settings.affiliateEnabled === "true") {
        const referrerUser = await prisma.user.findUnique({
          where: { id: dbUserReferrer.referredBy }
        });
        if (referrerUser) {
          const referrerSub = await prisma.subscription.findUnique({
            where: { tenantId: referrerUser.tenantId }
          });
          const isPaid = referrerSub && referrerSub.status === "ACTIVE" && referrerSub.planId !== "free-plan" && referrerSub.planId !== "starter";
          if (isPaid) {
            expectedAmount = Math.round(expectedAmount * 0.9);
          }
        }
      }
    }

    const submittedAmount = parseInt(String(amount), 10);
    if (expectedAmount > 0 && submittedAmount !== expectedAmount) {
      return NextResponse.json({ error: `Incorrect payment amount submitted. Expected ₹${expectedAmount}.` }, { status: 400 });
    }

    // Verify if UTR is unique
    const existing = await prisma.paymentRequest.findUnique({
      where: { utr }
    });

    if (existing) {
      return NextResponse.json({ error: "This UTR transaction ID has already been submitted." }, { status: 400 });
    }

    const request = await prisma.paymentRequest.create({
      data: {
        tenantId: user.tenantId,
        planId,
        amount: parseInt(String(amount), 10),
        utr,
        status: "PENDING"
      }
    });

    // Fetch user details to get their name
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true }
    });
    const userName = dbUser?.name || "User";

    // Send payment submission notification email asynchronously
    sendPaymentRequestEmail(user.email, userName, planId, request.amount, utr).catch((err) => {
      console.error("Failed to send payment request notification email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Payment request submitted successfully! Admin will verify and activate your plan.",
      request
    });

  } catch (error: any) {
    console.error("POST Payment Request Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
