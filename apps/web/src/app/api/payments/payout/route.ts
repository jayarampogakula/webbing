import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

// GET: Fetch affiliate stats, referral logs, and payout history
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Fetch all commissions
    const commissions = await prisma.affiliateCommission.findMany({
      where: { referrerId: user.userId },
      include: {
        paymentRequest: {
          include: { tenant: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch payout requests
    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" }
    });

    // 3. Calculate statistics
    let totalEarned = 0;
    let pendingBalance = 0;
    let maturedBalance = 0;

    for (const comm of commissions) {
      if (comm.status === "CANCELLED") continue;
      
      totalEarned += comm.amount;
      
      if (comm.status === "PENDING") {
        if (new Date(comm.availableAt).getTime() <= now.getTime()) {
          maturedBalance += comm.amount;
        } else {
          pendingBalance += comm.amount;
        }
      } else if (comm.status === "AVAILABLE") {
        maturedBalance += comm.amount;
      }
    }

    // Deduct pending or approved payouts from matured balance to get net available balance
    const activePayoutsSum = payouts
      .filter(p => p.status === "PENDING" || p.status === "APPROVED")
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, maturedBalance - activePayoutsSum);

    // Map commissions log for UI display
    const referralsLog = commissions.map(comm => ({
      id: comm.id,
      amount: comm.amount,
      refereeEmail: comm.paymentRequest.tenant.slug.split("-")[0] + "@webbing.in", // mask email or show workspace slug
      planId: comm.paymentRequest.planId,
      status: comm.status === "PENDING" && new Date(comm.availableAt).getTime() <= now.getTime() ? "AVAILABLE" : comm.status,
      availableAt: comm.availableAt,
      createdAt: comm.createdAt
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalEarned,
        pendingBalance,
        availableBalance,
        activePayoutsSum
      },
      referralsLog,
      payouts
    });

  } catch (error: any) {
    console.error("GET Payout/Affiliate Stats Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Request a new payout to UPI
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { upiId, amount } = await req.json();

    if (!upiId || !amount) {
      return NextResponse.json({ error: "UPI ID and withdrawal amount are required." }, { status: 400 });
    }

    const withdrawAmount = parseInt(String(amount), 10);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount." }, { status: 400 });
    }

    // Calculate current available balance
    const commissions = await prisma.affiliateCommission.findMany({
      where: { referrerId: user.userId }
    });

    const payouts = await prisma.payoutRequest.findMany({
      where: { userId: user.userId }
    });

    const now = new Date();
    let maturedBalance = 0;

    for (const comm of commissions) {
      if (comm.status === "CANCELLED" || comm.status === "WITHDRAWN") continue;
      if (comm.status === "AVAILABLE" || (comm.status === "PENDING" && new Date(comm.availableAt).getTime() <= now.getTime())) {
        maturedBalance += comm.amount;
      }
    }

    const activePayoutsSum = payouts
      .filter(p => p.status === "PENDING" || p.status === "APPROVED")
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, maturedBalance - activePayoutsSum);

    if (withdrawAmount > availableBalance) {
      return NextResponse.json({ error: `Insufficient available balance. You can withdraw up to ₹${availableBalance.toLocaleString()}.` }, { status: 400 });
    }

    // Create Payout Request
    const request = await prisma.payoutRequest.create({
      data: {
        userId: user.userId,
        upiId: upiId.trim(),
        amount: withdrawAmount,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request of ₹${withdrawAmount.toLocaleString()} submitted successfully!`,
      request
    });

  } catch (error: any) {
    console.error("POST Payout Request Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
