import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { AIService } from "@webbing/ai";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
      include: {
        pages: {
          include: {
            sections: { orderBy: { order: "asc" } }
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

    const page = project.pages[0];
    if (!page) {
      return NextResponse.json({ error: "No page found for project" }, { status: 400 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Fetch active LLM keys
    const activeKeys = await prisma.llmApiKey.findMany({
      where: {
        isActive: true,
        OR: [
          { scope: "GLOBAL" },
          { scope: "USER", ownerUserId: user.userId }
        ]
      }
    });

    const customKeys = activeKeys.map(k => ({
      provider: k.provider.toLowerCase(),
      secret: k.secret,
      model: k.model || undefined
    }));

    const preferredProvider = (project.theme as any)?.preferredProvider || "gemini";
    const aiService = new AIService(customKeys);

    // 2. Format LLM refinement prompt
    const systemPrompt = `You are a structured website refactoring AI. You are editing the sections of a landing page layout.
Return ONLY a valid JSON object matching the requested schema. Do not write introductory or concluding remarks.
Your response MUST match this structure:
{
  "sections": [
    {
      "type": "HEADER" | "HERO" | "FEATURES" | "SERVICES" | "TESTIMONIALS" | "PRICING" | "FAQS" | "CTA" | "ABOUT" | "CONTACT" | "FOOTER",
      "order": number,
      "content": { ... },
      "styles": { ... }
    }
  ]
}

Only return the updated sections matching the user's intent. Preserve unmodified sections. If the user asks to add a section, create a new section object with the appropriate structure and values.`;

    const userPrompt = `
      Niche Details:
      Style: ${(project.theme as any)?.style || "Modern Startup"}
      Name: ${project.name}
      Description: ${project.description || ""}

      Refinement Request:
      "${prompt}"

      Current Page Sections:
      ${JSON.stringify(page.sections.map(s => ({ type: s.type, order: s.order, content: s.content, styles: s.styles })), null, 2)}
    `;

    // 3. Call AI service to update layout JSON mapping
    const result = await aiService.getProvider(preferredProvider).generateJson<{ sections: any[] }>({
      prompt: userPrompt,
      systemPrompt
    });

    if (!result || !Array.isArray(result.sections)) {
      throw new Error("Invalid response format received from LLM.");
    }

    // 4. Update database transactionally
    await prisma.$transaction(async (tx) => {
      // Clear previous sections for this page
      await tx.section.deleteMany({
        where: { pageId: page.id }
      });

      // Insert updated list
      for (const sec of result.sections) {
        await tx.section.create({
          data: {
            pageId: page.id,
            type: sec.type.toUpperCase(),
            order: Number(sec.order),
            content: sec.content || {},
            styles: sec.styles || {}
          }
        });
      }
    });

    return NextResponse.json({ success: true, message: "Applied layout edits successfully." });
  } catch (error: any) {
    console.error("AI edit chat exception:", error);
    return NextResponse.json({ error: error.message || "Failed to process prompt edits." }, { status: 500 });
  }
}
