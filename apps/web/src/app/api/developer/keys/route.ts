import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure they are on Agency plan or Admin
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { subscription: true }
    });
    const planId = tenant?.subscription?.planId || "free-plan";
    if (planId !== "agency" && planId !== "agency-plan" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Developer API access is only available on the Agency plan. Please upgrade." }, { status: 403 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    console.error("GET Developer Keys Exception:", error);
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

    // Ensure they are on Agency plan or Admin
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { subscription: true }
    });
    const planId = tenant?.subscription?.planId || "free-plan";
    if (planId !== "agency" && planId !== "agency-plan" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Developer API access is only available on the Agency plan. Please upgrade." }, { status: 403 });
    }

    const keyToken = `sk_live_${randomBytes(24).toString("hex")}`;
    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.userId,
        key: keyToken
      }
    });

    return NextResponse.json({ success: true, key: newKey });
  } catch (error: any) {
    console.error("POST Developer Keys Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ error: "Key ID parameter required" }, { status: 400 });
    }

    // Verify key ownership
    const keyRecord = await prisma.apiKey.findUnique({
      where: { id: keyId }
    });

    if (!keyRecord) {
      return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    if (keyRecord.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    return NextResponse.json({ success: true, message: "API key revoked successfully." });
  } catch (error: any) {
    console.error("DELETE Developer Keys Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
