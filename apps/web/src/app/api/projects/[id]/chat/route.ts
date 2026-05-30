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
    const result = await aiService.getProvider(preferredProvider).generateJson<any>({
      prompt: userPrompt,
      systemPrompt
    });

    console.log("AI Edit Chat raw result:", JSON.stringify(result, null, 2));

    let rawSections: any[] | null = null;
    if (result) {
      if (Array.isArray(result.sections)) {
        rawSections = result.sections;
      } else if (Array.isArray(result)) {
        rawSections = result;
      } else if (result.pages && Array.isArray(result.pages[0]?.sections)) {
        rawSections = result.pages[0].sections;
      } else if (result.page && Array.isArray(result.page.sections)) {
        rawSections = result.page.sections;
      }
    }

    if (!rawSections || !Array.isArray(rawSections) || rawSections.length === 0) {
      console.error("Invalid response format from LLM. Raw response:", result);
      throw new Error("Invalid response format received from LLM. No sections array found.");
    }

    // Filter out invalid items and format them
    const updatedSections = rawSections
      .filter((s: any) => s && typeof s === "object" && typeof s.type === "string")
      .map((s: any) => ({
        type: s.type.toUpperCase(),
        order: Number(s.order) || 0,
        content: s.content || {},
        styles: s.styles || {}
      }));

    if (updatedSections.length === 0) {
      throw new Error("No valid sections found in the LLM response.");
    }

    // Merge updated sections with existing page sections to protect against partial updates
    const existingSectionsMap = new Map(page.sections.map(s => [s.type.toUpperCase(), {
      type: s.type.toUpperCase(),
      order: s.order,
      content: s.content as any,
      styles: s.styles as any
    }]));

    for (const sec of updatedSections) {
      existingSectionsMap.set(sec.type, sec);
    }

    const finalSections = Array.from(existingSectionsMap.values()).sort((a, b) => a.order - b.order);

    // 4. Update database transactionally
    await prisma.$transaction(async (tx) => {
      // Clear previous sections for this page
      await tx.section.deleteMany({
        where: { pageId: page.id }
      });

      // Insert updated merged list
      for (let i = 0; i < finalSections.length; i++) {
        const sec = finalSections[i];
        await tx.section.create({
          data: {
            pageId: page.id,
            type: sec.type,
            order: sec.order || (i + 1),
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
