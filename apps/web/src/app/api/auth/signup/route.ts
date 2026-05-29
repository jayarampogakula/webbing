import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, hashPassword, Role, SubscriptionStatus } from "@webbing/db";
import { signSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { name, email, password, tenantName } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();
    if (!emailClean.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 2. Create or associate Tenant
    const slug = emailClean.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    const finalTenantName = tenantName?.trim() || `${name}'s Workspace`;

    const tenant = await prisma.tenant.create({
      data: {
        name: finalTenantName,
        slug: slug,
      },
    });

    // 3. Hash password and create User
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: emailClean,
        name: name.trim(),
        passwordHash,
        role: Role.USER,
        tenantId: tenant.id,
      },
    });

    // 4. Create Free tier Subscription
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: "free-plan",
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        creditsLimit: 10,
        creditsUsed: 0,
      },
    });

    // 5. Generate signed session
    const sessionToken = signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // 6. Set HttpOnly cookie
    const cookieStore = cookies();
    cookieStore.set("webbing-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      email: user.email,
    });
  } catch (error: any) {
    console.error("Sign-up API Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
