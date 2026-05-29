import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, ProjectStatus } from "@webbing/db";
import { websiteGenerationQueue } from "@/lib/redis";
import { verifySession } from "@/lib/session";
import * as z from "zod";

const generationSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(5),
  niche: z.string().min(2),
  style: z.string().default("modern"),
  colors: z.string().default("#000000"),
  ecommerce: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const body = await req.json();
    const validated = generationSchema.parse(body);

    // 2. Verify tenant exists and check credits quota
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant/Workspace not found" }, { status: 404 });
    }

    if (tenant.subscription) {
      const { creditsLimit, creditsUsed } = tenant.subscription;
      if (creditsUsed >= creditsLimit) {
        return NextResponse.json(
          { error: "Insufficient AI credits quota. Please upgrade your plan." },
          { status: 403 }
        );
      }
    }

    // 3. Generate a unique subdomain slug
    const cleanName = validated.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const uniqueSlug = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create Draft Project
    const project = await prisma.project.create({
      data: {
        name: validated.name,
        description: validated.prompt,
        subdomain: uniqueSlug,
        status: ProjectStatus.DRAFT,
        theme: {
          primary: validated.colors,
          style: validated.style
        },
        tenantId: tenantId,
      }
    });

    // 5. Enqueue BullMQ Background Generation Job
    await websiteGenerationQueue.add("generate-website", {
      projectId: project.id,
      prompt: validated.prompt,
      niche: validated.niche,
      style: validated.style,
      colors: validated.colors,
      ecommerce: validated.ecommerce,
    });

    // 6. Increment Tenant credits count
    if (tenant.subscription) {
      await prisma.subscription.update({
        where: { tenantId: tenantId },
        data: { creditsUsed: { increment: 1 } }
      });
    }

    // 7. Return Project details
    return NextResponse.json({
      success: true,
      message: "Website generation job enqueued",
      projectId: project.id,
      subdomain: uniqueSlug,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("API Generate Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
