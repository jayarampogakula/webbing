import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

// GET: Retrieve all feedbacks (Admin only)
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error: any) {
    console.error("GET Feedbacks Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Submit a feedback or bug report
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, title, message } = await req.json();

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Type, title, and message are required." }, { status: 400 });
    }

    if (type !== "BUG" && type !== "FEEDBACK") {
      return NextResponse.json({ error: "Invalid type. Must be 'BUG' or 'FEEDBACK'." }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        userEmail: user.email,
        type,
        title,
        message,
        status: "OPEN"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully! Thank you.",
      feedback
    });
  } catch (error: any) {
    console.error("POST Feedback Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
