import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { randomBytes } from "crypto";

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
        customDomain: true,
        pages: true,
        tenant: {
          include: { subscription: true }
        }
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && project.userId && project.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { name, customDomain, selfHosted, subdomain, theme, seo } = await req.json();

    // 0. Update project name
    if (name !== undefined) {
      const cleanName = name.trim();
      if (cleanName) {
        await prisma.project.update({
          where: { id: projectId },
          data: { name: cleanName },
        });
      }
    }

    // 1. Update selfHosted status
    if (selfHosted !== undefined) {
      await prisma.project.update({
        where: { id: projectId },
        data: { selfHosted: !!selfHosted },
      });
    }

    // 2. Update subdomain prefix with uniqueness check
    if (subdomain !== undefined) {
      const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!cleanSubdomain) {
        return NextResponse.json({ error: "Invalid subdomain prefix" }, { status: 400 });
      }
      
      const existingProject = await prisma.project.findFirst({
        where: {
          subdomain: cleanSubdomain,
          id: { not: projectId }
        }
      });
      if (existingProject) {
        return NextResponse.json({ error: "Subdomain prefix is already taken by another project" }, { status: 400 });
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { subdomain: cleanSubdomain }
      });
    }

    // 3. Update theme settings (preferredProvider, analyticsTag, etc.)
    if (theme !== undefined) {
      await prisma.project.update({
        where: { id: projectId },
        data: { theme }
      });
    }

    // 4. Update SEO on page
    if (seo !== undefined) {
      const page = project.pages.find((p) => p.slug === "index") || project.pages[0];
      if (page) {
        await prisma.page.update({
          where: { id: page.id },
          data: {
            title: seo.title || page.title,
            description: seo.description || page.description,
            seoMetadata: {
              title: seo.title || "",
              description: seo.description || ""
            }
          }
        });
      }
    }

    // 5. Update Custom Domain Mapping
    if (customDomain !== undefined) {
      const hostname = customDomain.trim().toLowerCase();
      if (hostname) {
        const planId = project.tenant?.subscription?.planId || "free-plan";
        if (planId === "free-plan" || planId === "starter") {
          return NextResponse.json({ error: "Custom domain mapping is only available on Pro and Agency plans. Please upgrade." }, { status: 400 });
        }
      }
      if (!hostname) {
        // Remove existing mapping if any
        if (project.customDomain) {
          await prisma.customDomain.delete({
            where: { projectId },
          });
        }
      } else {
        // Upsert Custom Domain
        const dnsToken = `webbing-verification=${randomBytes(16).toString("hex")}`;
        await prisma.customDomain.upsert({
          where: { projectId },
          update: {
            hostname,
            // Keep verification if domain is the same
            verified: project.customDomain?.hostname === hostname ? (project.customDomain?.verified ?? false) : false,
          },
          create: {
            projectId,
            hostname,
            dnsToken,
            verified: false,
            sslStatus: "PENDING",
          },
        });
      }
    }

    const updatedProject = await prisma.project.findFirst({
      where: { id: projectId },
      include: {
        customDomain: true,
        pages: {
          include: {
            sections: { orderBy: { order: "asc" } }
          }
        }
      },
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("Project settings API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
