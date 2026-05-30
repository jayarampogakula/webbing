import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import * as z from "zod";

const editSchema = z.object({
  name: z.string().min(1).optional(),
  hero: z.object({
    heading: z.string().min(1).optional(),
    subheading: z.string().min(1).optional(),
    ctaText: z.string().min(1).optional(),
    ctaUrl: z.string().min(1).optional(),
  }).optional(),
  about: z.object({
    heading: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  }).optional(),
  contactEmail: z.string().email().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const projectId = params.id;
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
      include: {
        pages: {
          include: {
            sections: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && project.userId && project.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const validated = editSchema.parse(body);

    // 1. Update Project Name if provided
    if (validated.name) {
      await prisma.project.update({
        where: { id: projectId },
        data: { name: validated.name },
      });
    }

    // Resolve main index page
    const page = project.pages.find((p) => p.slug === "index") || project.pages[0];
    if (!page) {
      return NextResponse.json({ error: "No editable pages found for this project." }, { status: 400 });
    }

    // 2. Perform overrides on HERO
    if (validated.hero) {
      const heroSection = page.sections.find((s) => s.type === "HERO");
      if (heroSection) {
        const currentContent = (heroSection.content as any) || {};
        await prisma.section.update({
          where: { id: heroSection.id },
          data: {
            content: {
              ...currentContent,
              heading: validated.hero.heading ?? currentContent.heading,
              subheading: validated.hero.subheading ?? currentContent.subheading,
              ctaText: validated.hero.ctaText ?? currentContent.ctaText,
              ctaUrl: validated.hero.ctaUrl ?? currentContent.ctaUrl,
            }
          }
        });
      }
    }

    // 3. Perform overrides on ABOUT
    if (validated.about) {
      const aboutSection = page.sections.find((s) => s.type === "ABOUT");
      if (aboutSection) {
        const currentContent = (aboutSection.content as any) || {};
        await prisma.section.update({
          where: { id: aboutSection.id },
          data: {
            content: {
              ...currentContent,
              heading: validated.about.heading ?? currentContent.heading,
              body: validated.about.body ?? currentContent.body,
            }
          }
        });
      }
    }

    // 4. Perform overrides on CONTACT
    if (validated.contactEmail) {
      const contactSection = page.sections.find((s) => s.type === "CONTACT");
      if (contactSection) {
        const currentContent = (contactSection.content as any) || {};
        await prisma.section.update({
          where: { id: contactSection.id },
          data: {
            content: {
              ...currentContent,
              email: validated.contactEmail,
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Website content saved successfully.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Project edit API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
