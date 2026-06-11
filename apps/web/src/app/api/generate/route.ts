import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, ProjectStatus } from "@webbing/db";
import { websiteGenerationQueue } from "@/lib/redis";
import { verifySession } from "@/lib/session";
import * as z from "zod";

const generationSchema = z.object({
  name: z.string().optional().or(z.literal("")).transform(val => !val || val.trim() === "" ? "My Website" : val).default("My Website"),
  businessName: z.string().optional().or(z.literal("")).transform(val => !val || val.trim() === "" ? "My Business" : val).default("My Business"),
  prompt: z.string().min(5),
  keywords: z.string().default(""),
  niche: z.string().default(""), // Industry (optional)
  targetAudience: z.string().default(""),
  style: z.string().default("Modern Startup"),
  ecommerce: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session cookie or Authorization header API key
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    let user = sessionToken ? verifySession(sessionToken) : null;

    const authHeader = req.headers.get("Authorization");
    if (!user && authHeader && authHeader.startsWith("Bearer ")) {
      const apiKeyString = authHeader.replace("Bearer ", "").trim();
      const dbKey = await prisma.apiKey.findUnique({
        where: { key: apiKeyString },
        include: { user: true }
      });
      if (dbKey && dbKey.user) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: dbKey.user.tenantId },
          include: { subscription: true }
        });
        const planId = tenant?.subscription?.planId || "free-plan";
        if (planId !== "agency" && planId !== "agency-plan" && dbKey.user.role !== "ADMIN") {
          return NextResponse.json({ error: "Developer API access is only available on the Agency plan. Please upgrade." }, { status: 403 });
        }
        
        user = {
          userId: dbKey.user.id,
          email: dbKey.user.email,
          role: dbKey.user.role,
          tenantId: dbKey.user.tenantId
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in or provide a valid API Key." }, { status: 401 });
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

    const requiredCredits = validated.ecommerce ? 25 : 5;

    // Enforce active website count limit based on the subscription plan
    const activeProjectsCount = await prisma.project.count({
      where: { tenantId: tenantId }
    });

    const planId = tenant.subscription?.planId?.toLowerCase() || "free-plan";
    let maxWebsites = 1;
    if (planId.includes("individual")) {
      maxWebsites = 2;
    } else if (planId.includes("pro-plan")) {
      maxWebsites = 10;
    } else if (planId.includes("agency")) {
      maxWebsites = 50;
    }

    if (activeProjectsCount >= maxWebsites) {
      return NextResponse.json(
        { error: `Website limit reached. Your current plan allows a maximum of ${maxWebsites} active website(s). Please delete an existing website first or upgrade your plan.` },
        { status: 403 }
      );
    }

    // Check if user has active custom keys
    const userKeysCount = await prisma.llmApiKey.count({
      where: {
        ownerUserId: user.userId,
        scope: "USER",
        isActive: true
      }
    });
    const hasUserKeys = userKeysCount > 0;

    if (tenant.subscription && !hasUserKeys) {
      const { creditsLimit, creditsUsed } = tenant.subscription;
      if (creditsUsed + requiredCredits > creditsLimit) {
        return NextResponse.json(
          { error: `Insufficient AI credits quota. This action requires ${requiredCredits} credits, but you only have ${creditsLimit - creditsUsed} left.` },
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
          style: validated.style,
          preferredProvider: "gemini", // Default to user choice of Gemini
          metadata: {
            businessName: validated.businessName,
            keywords: validated.keywords,
            industry: validated.niche,
            targetAudience: validated.targetAudience
          }
        },
        tenantId: tenantId,
        userId: user.userId,
      }
    });

    // 5. Enqueue BullMQ Background Generation Job
    await websiteGenerationQueue.add("generate-website", {
      projectId: project.id,
      prompt: validated.prompt,
      niche: validated.niche,
      style: validated.style,
      colors: "#000000",
      ecommerce: validated.ecommerce,
      userId: user.userId,
    });

    // 6. Increment Tenant credits count
    if (tenant.subscription && !hasUserKeys) {
      await prisma.subscription.update({
        where: { tenantId: tenantId },
        data: { creditsUsed: { increment: requiredCredits } }
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
