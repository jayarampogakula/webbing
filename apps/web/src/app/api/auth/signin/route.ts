import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Role, SubscriptionStatus, hashPassword, prisma, verifyPassword } from "@webbing/db";
import { signSession } from "@/lib/session";

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
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 2. Verify password hash
    const isValid = verifyPassword(password, user.passwordHash);

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
