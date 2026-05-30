import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

// GET: Fetch global settings (like UPI ID)
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upiSetting = await prisma.systemSetting.findUnique({
      where: { key: "upiId" }
    });

    return NextResponse.json({
      success: true,
      upiId: upiSetting?.value || "pogakula@ybl"
    });
  } catch (error: any) {
    console.error("GET Admin Settings Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save global settings (Admin only)
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { upiId } = await req.json();

    if (!upiId) {
      return NextResponse.json({ error: "UPI ID is required" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "upiId" },
      update: { value: upiId },
      create: { key: "upiId", value: upiId }
    });

    return NextResponse.json({
      success: true,
      message: "Global settings successfully updated"
    });
  } catch (error: any) {
    console.error("POST Admin Settings Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
