import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

// GET: Fetch all plans (accessible to authenticated users)
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [plans, settings] = await Promise.all([
      prisma.plan.findMany({ orderBy: { price: "asc" } }),
      prisma.systemSetting.findMany({
        where: { key: { startsWith: "yearlyDiscount_" } }
      })
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const plansWithDiscounts = plans.map((p) => ({
      ...p,
      yearlyDiscount: parseInt(settingsMap[`yearlyDiscount_${p.id}`] || "0", 10)
    }));

    return NextResponse.json({ success: true, plans: plansWithDiscounts });
  } catch (error: any) {
    console.error("GET Plans API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create or Update a plan (Admin only)
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id, name, price, creditsLimit, features, yearlyDiscount } = await req.json();

    if (!name || price === undefined || creditsLimit === undefined) {
      return NextResponse.json({ error: "Name, price, and credits limit are required." }, { status: 400 });
    }

    let plan;
    if (id) {
      plan = await prisma.plan.update({
        where: { id },
        data: {
          name,
          price: parseInt(String(price), 10),
          creditsLimit: parseInt(String(creditsLimit), 10),
          features: features || ""
        }
      });
    } else {
      plan = await prisma.plan.create({
        data: {
          name,
          price: parseInt(String(price), 10),
          creditsLimit: parseInt(String(creditsLimit), 10),
          features: features || ""
        }
      });
    }

    if (yearlyDiscount !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: `yearlyDiscount_${plan.id}` },
        update: { value: String(yearlyDiscount) },
        create: { key: `yearlyDiscount_${plan.id}`, value: String(yearlyDiscount) }
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("POST Plan API Exception:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a plan (Admin only)
export async function DELETE(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required." }, { status: 400 });
    }

    await Promise.all([
      prisma.plan.delete({
        where: { id }
      }),
      prisma.systemSetting.deleteMany({
        where: { key: `yearlyDiscount_${id}` }
      })
    ]);

    return NextResponse.json({ success: true, message: "Plan deleted successfully." });
  } catch (error: any) {
    console.error("DELETE Plan API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
