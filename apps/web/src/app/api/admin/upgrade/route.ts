import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
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

    const { tenantId } = await req.json();

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

    // 3. Update subscription quota
    const updated = await prisma.subscription.update({
      where: { tenantId },
      data: {
        creditsLimit: { increment: 100 },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully upgraded quota by 100 credits",
      newLimit: updated.creditsLimit,
    });
  } catch (error: any) {
    console.error("Admin Upgrade API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
