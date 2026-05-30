import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

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
