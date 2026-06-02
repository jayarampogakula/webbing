import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
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

    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return NextResponse.json({ error: "Payout request not found." }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "This request has already been processed." }, { status: 400 });
    }

    if (action === "REJECT") {
      const updated = await prisma.payoutRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      return NextResponse.json({ success: true, message: "Payout request rejected.", request: updated });
    }

    if (action === "APPROVE") {
      const updated = await prisma.payoutRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });
      return NextResponse.json({ success: true, message: "Payout request approved.", request: updated });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("POST Admin Payout Approve Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
