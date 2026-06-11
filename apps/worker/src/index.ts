import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { prisma, ProjectStatus, LlmKeyScope } from "@webbing/db";
import { AIService } from "@webbing/ai";
import * as dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const aiService = new AIService();

console.log("Starting Webbing Background Job Worker...");

interface WebsiteGenerationJobData {
  projectId: string;
  prompt: string;
  niche: string;
  style: string;
  colors: string;
  ecommerce: boolean;
  userId?: string;
}

const worker = new Worker<WebsiteGenerationJobData>(
  "website-generation",
  async (job: Job<WebsiteGenerationJobData>) => {
    const { projectId, prompt, style, ecommerce, userId } = job.data;
    console.log(`Processing website generation for project: ${projectId}`);
    
    // 1. Update Project Status to GENERATING
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.GENERATING }
    });

    try {
      // Fetch active LLM keys for this user/scope
      const activeKeys = await prisma.llmApiKey.findMany({
        where: {
          isActive: true,
          OR: [
            { scope: LlmKeyScope.GLOBAL },
            ...(userId ? [{ scope: LlmKeyScope.USER, ownerUserId: userId }] : [])
          ]
        }
      });

      // Prioritize USER scope keys over GLOBAL keys for the same provider
      const keysMap = new Map<string, typeof activeKeys[0]>();
      for (const k of activeKeys) {
        if (k.scope === LlmKeyScope.GLOBAL) {
          keysMap.set(k.provider.toLowerCase(), k);
        }
      }
      for (const k of activeKeys) {
        if (k.scope === LlmKeyScope.USER) {
          keysMap.set(k.provider.toLowerCase(), k);
        }
      }

      const customKeys = Array.from(keysMap.values()).map(k => ({
        provider: k.provider.toLowerCase(),
        secret: k.secret,
        model: k.model || undefined
      }));

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      const themeObj = (project?.theme as any) || {};
      const metadata = themeObj.metadata || {};
      const preferredProvider = themeObj.preferredProvider || undefined;

      const dynamicAiService = new AIService(customKeys);

      // 2. Query the AI orchestration pipeline
      const generationOutput = await dynamicAiService.generateWebsiteLayout(
        prompt,
        style,
        preferredProvider,
        {
          websiteName: project?.name,
          businessName: metadata.businessName || project?.name,
          keywords: metadata.keywords,
          industry: metadata.industry,
          targetAudience: metadata.targetAudience,
          ecommerce: ecommerce
        }
      );
      
      // 3. Begin Database Transaction
      await prisma.$transaction(async (tx) => {
        // Clear previous pages (sections will cascade delete) and store data to support regeneration
        await tx.page.deleteMany({ where: { projectId } });
        await tx.ecomStore.deleteMany({ where: { projectId } });

        // Update project theme config
        await tx.project.update({
          where: { id: projectId },
          data: {
            theme: {
              ...themeObj,
              ...(generationOutput.theme || {}),
              metadata: {
                ...((themeObj.metadata) || {}),
                ...(generationOutput.theme?.metadata || {}),
                isEcommerce: ecommerce
              }
            }
          }
        });

        // Insert Pages and Sections
        const pages = generationOutput.pages || [];
        for (const p of pages) {
          const page = await tx.page.create({
            data: {
              projectId,
              slug: p.slug,
              title: p.title,
              description: p.description,
              seoMetadata: {
                title: p.title,
                description: p.description,
                keywords: [p.slug]
              }
            }
          });

          const sections = p.sections || [];
          for (const s of sections) {
            await tx.section.create({
              data: {
                pageId: page.id,
                type: s.type,
                order: s.order,
                content: s.content || {},
                styles: s.styles || {}
              }
            });
          }
        }

        // If e-commerce was requested, build EcomStore template using generated items
        if (ecommerce) {
          const aiProducts = Array.isArray(generationOutput?.products) ? generationOutput.products : [];
          const productsToCreate = aiProducts.map((p: any) => {
            const descriptionJson = JSON.stringify({
              bodyText: p.description || "No description available.",
              category: p.category || "General",
              variants: Array.isArray(p.variants) ? p.variants : [],
              specifications: p.specifications && typeof p.specifications === "object" ? p.specifications : {},
              sku: `SKU-${(p.name || "ITEM").slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
            });

            let rawPrice = p.price;
            if (typeof rawPrice === "string") {
              rawPrice = Number(rawPrice.replace(/[^0-9.]/g, ""));
            }
            const finalPrice = isNaN(Number(rawPrice)) || Number(rawPrice) <= 0 ? 1299 : Number(rawPrice);

            let rawInventory = p.inventory;
            if (typeof rawInventory === "string") {
              rawInventory = Number(rawInventory.replace(/[^0-9]/g, ""));
            }
            const finalInventory = isNaN(Number(rawInventory)) || Number(rawInventory) < 0 ? 100 : Number(rawInventory);

            const finalImages = Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []);

            return {
              name: p.name || "Sample Product",
              description: descriptionJson,
              price: finalPrice,
              inventory: finalInventory,
              images: finalImages
            };
          });

          if (productsToCreate.length === 0) {
            productsToCreate.push(
              {
                name: "Premium Niche Item A",
                description: JSON.stringify({ bodyText: "Handcrafted high-quality item.", category: "General", variants: [], specifications: {}, sku: "SKU-A" }),
                price: 1999,
                inventory: 100,
                images: []
              },
              {
                name: "Premium Niche Item B",
                description: JSON.stringify({ bodyText: "Designed for premium durability and styling.", category: "General", variants: [], specifications: {}, sku: "SKU-B" }),
                price: 2499,
                inventory: 50,
                images: []
              }
            );
          }

          await tx.ecomStore.create({
            data: {
              projectId,
              products: {
                create: productsToCreate
              }
            }
          });
        }
      });

      // 4. Mark Project Status as DRAFT
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.DRAFT }
      });
      
      console.log(`Successfully completed generation for project: ${projectId}`);
      return { success: true };
    } catch (err: any) {
      console.error(`Failed to generate website for project ${projectId}:`, err);
      const message = err instanceof Error ? err.message : String(err);
      
      try {
        const currentProject = await prisma.project.findUnique({ where: { id: projectId } });
        const currentTheme = (currentProject?.theme as any) || {};
        
        // Mark project as FAILED and record failureReason inside theme
        await prisma.project.update({
          where: { id: projectId },
          data: { 
            status: ProjectStatus.FAILED,
            theme: {
              ...currentTheme,
              failureReason: message
            }
          }
        });
      } catch (dbErr) {
        console.error("Failed to write FAILED status back to DB:", dbErr);
      }
      
      throw err;
    }
  },
  { connection: connection as any }
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id}. Error:`, err);
});
