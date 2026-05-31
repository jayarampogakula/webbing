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

Only return the updated sections matching the user's intent. Preserve unmodified sections. If the user asks to add a section, create a new section object with the appropriate structure and values.

IMPORTANT FOR IMAGES:
If the user requests to add, edit, or modify images, or for any new section that requires an image, choose a highly relevant high-resolution image URL from Unsplash. Use this format: \`https://images.unsplash.com/photo-[UNSPLASH_ID]?auto=format&fit=crop&w=1200&q=80\`.
Choose an appropriate ID based on the niche:
- Gaming/Esports: '1542751371-adc38448a05e', '1511512578047-dfb367046420', '1612287230202-1bf1d85d1bdf', '1538481199705-c710c4e965fc'
- Fitness/Sports/Gym: '1517838277536-f5f99be501cd', '1518310383802-640c2de311b2', '1540555700478-4be289fbecef'
- SaaS/Technology/App: '1551434678-e076c223a692', '1486406146926-c627a92ad1ab', '1460925895917-afdab827c52f'
- Creator/Studio/Vlogger: '1478737270239-2f02b77fc618', '1590602847861-f357a9332bbc', '1516035069371-29a1b244cc32'
- Luxury/Fashion/Hotel: '1564507592333-c60657eea523', '1488161628813-04466f872be2', '1441986300917-64674bd600d8'
- Corporate/Finance/Business/Consulting: '1497366216548-37526070297c', '1454165804012-6e4a6a38b02b', '1486406146926-c627a92ad1ab'
- Education/Learning: '1523050854058-8df90110c9f1', '1427504494785-3a9ca7044f45'
- Store/Shop/Retail: '1472851294608-062f824d29cc', '1441986300917-64674bd600d8'
- Restaurant/Food/Cafe: '1517248135467-4c7edcad34c4', '1554118811-1e0d58224f24', '1504674900247-0877df9cc836'
- Real Estate/Home/Interior: '1564013799919-ab600027ffc6', '1580587771525-78b9dba3b914'
- Medical/Health: '1505751172876-fa1923c5c528', '1530026405186-ed1ea0ac7a63'
- Travel/Adventure: '1507525428034-b723cf961d3e', '1469854523086-cc02fe5d8800'
- Portfolio/Creative Agency: '1507238691740-187a5b1d37b8', '1513542789411-b6a5d4f31634'`;

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
