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
      include: { customDomain: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const { customDomain, selfHosted } = await req.json();

    // 1. Update selfHosted status
    if (selfHosted !== undefined) {
      await prisma.project.update({
        where: { id: projectId },
        data: { selfHosted: !!selfHosted },
      });
    }

    // 2. Update Custom Domain Mapping
    if (customDomain !== undefined) {
      const hostname = customDomain.trim().toLowerCase();
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
      include: { customDomain: true },
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
