import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, Role, hashPassword } from "@webbing/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const adminUserSession = sessionToken ? verifySession(sessionToken) : null;

    if (!adminUserSession || adminUserSession.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { userId, name, email, role, password } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 2. Verify user exists
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedData: any = {};
    if (name !== undefined) updatedData.name = name.trim();
    if (email !== undefined) updatedData.email = email.toLowerCase().trim();
    if (role !== undefined) {
      if (!Object.values(Role).includes(role as Role)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
      }
      updatedData.role = role as Role;
    }
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
      }
      updatedData.passwordHash = hashPassword(password);
    }

    // 3. Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Admin User Management API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
