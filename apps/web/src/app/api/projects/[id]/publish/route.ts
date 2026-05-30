import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, ProjectStatus } from "@webbing/db";
import { verifySession } from "@/lib/session";
import dns from "dns";

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
            sections: true
          }
        },
        customDomain: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 1. Verify subdomain configuration
    if (!project.subdomain) {
      return NextResponse.json({ success: false, error: "Subdomain prefix is not configured." }, { status: 400 });
    }

    // 2. Perform internal layout build rendering health check
    // We fetch the preview page internally from the nextjs server to make sure it loads and compiles successfully (status 200)
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const previewUrl = `${protocol}://${hostHeader}/preview/${project.id}`;

    let renderSuccess = false;
    let renderError = "";
    try {
      const response = await fetch(previewUrl, {
        method: "GET",
        headers: {
          "x-internal-publish-check": "true"
        }
      });
      if (response.ok && response.status === 200) {
        const html = await response.text();
        // Check that the generated code is not empty and includes standard tags
        if (html.includes("site-preview")) {
          renderSuccess = true;
        } else {
          renderError = "Preview page content is corrupted or missing container classes.";
        }
      } else {
        renderError = `Internal renderer returned status code: ${response.status}`;
      }
    } catch (e: any) {
      renderError = `Failed to connect to internal page renderer: ${e.message}`;
    }

    if (!renderSuccess) {
      return NextResponse.json({
        success: false,
        error: `Asset Integrity Check Failed: ${renderError}`
      }, { status: 400 });
    }

    // 3. DNS/SSL checks (Only in production/non-localhost)
    if (!hostHeader.includes("localhost") && !hostHeader.includes("127.0.0.1")) {
      const domainToCheck = project.customDomain?.verified ? project.customDomain.hostname : `${project.subdomain}.${hostHeader}`;
      try {
        await dns.promises.lookup(domainToCheck);
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `DNS Resolution Failed: Subdomain route ${domainToCheck} is not active yet.`
        }, { status: 400 });
      }
    }

    // 4. Everything checked out, mark project as PUBLISHED
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.PUBLISHED }
    });

    return NextResponse.json({
      success: true,
      message: "Website Published Successfully"
    });
  } catch (error: any) {
    console.error("Publishing API exception:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
