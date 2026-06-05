import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";
import { sendContactFormEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { projectId, name, email, message } = await req.json();

    if (!projectId || !name || !email || !message) {
      return NextResponse.json(
        { error: "All fields (projectId, name, email, message) are required." },
        { status: 400 }
      );
    }

    // Lookup project, including the creator user and pages/sections
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: true,
        pages: {
          include: {
            sections: {
              where: { type: "CONTACT" },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Save submission to database
    await prisma.contactSubmission.create({
      data: {
        projectId,
        name,
        email,
        message,
      },
    });

    // Find the email in the CONTACT section content
    let recipientEmail = "";
    const contactSection = project.pages
      .flatMap((p) => p.sections)
      .find((s) => s.type === "CONTACT");

    if (contactSection && typeof contactSection.content === "object" && contactSection.content !== null) {
      const content = contactSection.content as any;
      if (content.email && typeof content.email === "string" && content.email.trim() !== "" && content.email.toLowerCase() !== "hello@example.com") {
        recipientEmail = content.email.trim();
      }
    }

    // Fallback to project owner's email
    if (!recipientEmail && project.user?.email) {
      recipientEmail = project.user.email;
    }

    // Ultimate fallback if neither is found
    if (!recipientEmail) {
      recipientEmail = process.env.SMTP_USER || "support@webbing.in";
    }

    console.log(`[Contact API] Routing form submission to: ${recipientEmail}`);

    try {
      const emailSent = await sendContactFormEmail(
        recipientEmail,
        project.name,
        name,
        email,
        message
      );
      if (!emailSent) {
        console.warn(`[Contact API] SMTP delivery failed for: ${recipientEmail}`);
      }
    } catch (emailError) {
      console.error("[Contact API] SMTP exception during send:", emailError);
    }

    return NextResponse.json({ success: true, recipient: recipientEmail });
  } catch (error: any) {
    console.error("Error in contact form submission API:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
