import { NextResponse } from "next/server";
import { prisma, hashPassword } from "@webbing/db";
import { sendPasswordRecoveryEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const emailClean = email.toLowerCase().trim();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    // To prevent email enumeration, we return success even if user isn't found
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If your email is registered in our system, we have sent a temporary password to it.",
      });
    }

    // Generate a secure temporary password (8 characters)
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = hashPassword(tempPassword);

    // Save hashed password back to database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Send the temporary password via email
    await sendPasswordRecoveryEmail(emailClean, user.name || "User", tempPassword);

    return NextResponse.json({
      success: true,
      message: "If your email is registered in our system, we have sent a temporary password to it.",
    });
  } catch (error: any) {
    console.error("Forgot Password API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
