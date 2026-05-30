import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, ProjectStatus } from "@webbing/db";
import { websiteGenerationQueue } from "@/lib/redis";
import { verifySession } from "@/lib/session";
import * as z from "zod";

const regenerateSchema = z.object({
  prompt: z.string().min(5),
  style: z.string().default("Modern Editorial"),
  colors: z.string().default("#07111b"),
  ecommerce: z.boolean().default(false),
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
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && project.userId && project.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const validated = regenerateSchema.parse(body);

    // Verify credits quota
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { subscription: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    if (tenant.subscription) {
      const { creditsLimit, creditsUsed } = tenant.subscription;
      if (creditsUsed >= creditsLimit) {
        return NextResponse.json(
          { error: "Insufficient AI credits. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }

    // Reset status to DRAFT for background rebuild
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.DRAFT,
        description: validated.prompt,
        theme: {
          primary: validated.colors,
          style: validated.style
        }
      }
    });

    // Enqueue generation job
    await websiteGenerationQueue.add("generate-website", {
      projectId,
      prompt: validated.prompt,
      niche: "Updated Category",
      style: validated.style,
      colors: validated.colors,
      ecommerce: validated.ecommerce,
    });

    // Increment credits
    if (tenant.subscription) {
      await prisma.subscription.update({
        where: { tenantId: user.tenantId },
        data: { creditsUsed: { increment: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Website regeneration started successfully.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Project regeneration API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
