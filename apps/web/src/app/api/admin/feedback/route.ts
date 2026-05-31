import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

// PUT: Mark feedback as RESOLVED (Admin only)
export async function PUT(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feedbackId } = await req.json();

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required." }, { status: 400 });
    }

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: "RESOLVED" }
    });

    return NextResponse.json({
      success: true,
      message: "Feedback ticket marked as resolved. Action logged.",
      feedback: updated
    });
  } catch (error: any) {
    console.error("PUT Admin Feedback Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a feedback ticket (Admin only)
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    // Support query parameter or body payload
    let feedbackId = url.searchParams.get("id");
    if (!feedbackId) {
      const body = await req.json().catch(() => ({}));
      feedbackId = body.feedbackId;
    }

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required." }, { status: 400 });
    }

    await prisma.feedback.delete({
      where: { id: feedbackId }
    });

    return NextResponse.json({
      success: true,
      message: "Feedback ticket deleted successfully."
    });
  } catch (error: any) {
    console.error("DELETE Admin Feedback Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
