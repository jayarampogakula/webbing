import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { verifyLicenseOnline } from "@/lib/licensing";

// GET: Fetch global settings (like UPI ID, branding, etc.)
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      upiId: settingsMap.upiId || "pogakula@ybl"
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

    const body = await req.json();

    let settingsToSave: Record<string, string> = {};
    if (body.settings && typeof body.settings === "object") {
      settingsToSave = body.settings;
    } else if (body.upiId) {
      settingsToSave = { upiId: body.upiId };
    } else {
      return NextResponse.json({ error: "No settings provided" }, { status: 400 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
    const cleanHost = host.toLowerCase().split(":")[0];
    const isCursorWebs = cleanHost.includes("cursonwebs") || cleanHost.includes("cursorwebs");
    const prefix = isCursorWebs ? "cursorwebs_" : "";

    if (settingsToSave.licenseKey) {
      const verification = await verifyLicenseOnline(settingsToSave.licenseKey, host);
      if (!verification.success) {
        return NextResponse.json({ error: verification.error || "License verification failed." }, { status: 400 });
      }
    }

    await Promise.all(
      Object.entries(settingsToSave).map(([key, value]) => {
        if (value === null || value === undefined) return Promise.resolve();
        const dbKey = prefix + key;
        return prisma.systemSetting.upsert({
          where: { key: dbKey },
          update: { value: String(value) },
          create: { key: dbKey, value: String(value) }
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: "Global settings successfully updated"
    });
  } catch (error: any) {
    console.error("POST Admin Settings Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
