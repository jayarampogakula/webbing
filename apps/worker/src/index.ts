import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { prisma, ProjectStatus } from "@webbing/db";
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
}

const worker = new Worker<WebsiteGenerationJobData>(
  "website-generation",
  async (job: Job<WebsiteGenerationJobData>) => {
    const { projectId, prompt, style, ecommerce } = job.data;
    console.log(`Processing website generation for project: ${projectId}`);
    
    // 1. Update Project Status to GENERATING
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.GENERATING }
    });

    try {
      // 2. Query the AI orchestration pipeline
      const generationOutput = await aiService.generateWebsiteLayout(prompt, style);
      
      // 3. Begin Database Transaction
      await prisma.$transaction(async (tx) => {
        // Update project theme config
        await tx.project.update({
          where: { id: projectId },
          data: {
            theme: generationOutput.theme || {}
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

        // If e-commerce was requested, build a simple EcomStore template
        if (ecommerce) {
          await tx.ecomStore.create({
            data: {
              projectId,
              products: {
                create: [
                  {
                    name: "Sample Product A",
                    description: "High quality sample item generated for your store.",
                    price: 29.99,
                    inventory: 100
                  },
                  {
                    name: "Sample Product B",
                    description: "High quality sample item generated for your store.",
                    price: 49.99,
                    inventory: 50
                  }
                ]
              }
            }
          });
        }
      });

      // 4. Mark Project Status as PUBLISHED
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.PUBLISHED }
      });
      
      console.log(`Successfully completed generation for project: ${projectId}`);
      return { success: true };
    } catch (err) {
      console.error(`Failed to generate website for project ${projectId}:`, err);
      
      // Mark project as FAILED
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.FAILED }
      });
      
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
