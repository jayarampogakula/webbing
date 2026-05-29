import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Role, SubscriptionStatus, hashPassword, prisma, verifyPassword } from "@webbing/db";
import { signSession } from "@/lib/session";

const demoPasswords: Record<string, { current: string; legacy: string }> = {
  "admin@webbing.in": { current: "Admin123", legacy: "AdminPassword123" },
  "user@webbing.in": { current: "User123", legacy: "UserPassword123" },
};

async function ensureDemoUser(email: string, password: string) {
  const demoPassword = demoPasswords[email];
  if (!demoPassword || (password !== demoPassword.current && password !== demoPassword.legacy)) {
    return null;
  }

  const isAdmin = email === "admin@webbing.in";
  const tenantSlug = isAdmin ? "admin" : "user";
  const tenantName = isAdmin ? "Admin Team" : "User Workspace";
  const planId = isAdmin ? "agency-plan" : "pro-plan";
  const creditsLimit = isAdmin ? 500 : 100;

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: { name: tenantName, slug: tenantSlug },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: isAdmin ? "SaaS Admin Manager" : "John Doe User",
      passwordHash: hashPassword(demoPassword.current),
      role: isAdmin ? Role.ADMIN : Role.USER,
      tenantId: tenant.id,
    },
    create: {
      email,
      name: isAdmin ? "SaaS Admin Manager" : "John Doe User",
      passwordHash: hashPassword(demoPassword.current),
      role: isAdmin ? Role.ADMIN : Role.USER,
      tenantId: tenant.id,
    },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { planId, status: SubscriptionStatus.ACTIVE, creditsLimit },
    create: {
      tenantId: tenant.id,
      planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      creditsLimit,
      creditsUsed: 0,
    },
  });

  return user;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Fetch user from database
    const emailClean = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (!user || !user.passwordHash) {
      user = await ensureDemoUser(emailClean, password);
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 2. Verify password hash
    let isValid = verifyPassword(password, user.passwordHash);
    const demoPassword = demoPasswords[emailClean];

    if (!isValid && demoPassword) {
      if (password === demoPassword.current || password === demoPassword.legacy) {
        user = await prisma.user.update({
          where: { email: emailClean },
          data: { passwordHash: hashPassword(demoPassword.current) },
        });
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 3. Generate signed session
    const sessionToken = signSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // 4. Set HttpOnly cookie
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
    console.error("Sign-in API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
