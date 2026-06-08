import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

async function checkClientAuth(projectId: string, req: Request) {
  // 1. Check SaaS Session Cookie (Creator access)
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (user) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
    });
    if (project && (user.role === "ADMIN" || !project.userId || project.userId === user.userId)) {
      return true;
    }
  }

  // 2. Check Client Dashboard headers
  const clientEmail = req.headers.get("x-client-email");
  const clientPassword = req.headers.get("x-client-password");

  if (clientEmail && clientPassword) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (project) {
      const themeObj = (project.theme as any) || {};
      const metadata = themeObj.metadata || {};
      const clientLogins = metadata.clientLogins || [];

      // Check in clientLogins array
      const matchesArray = clientLogins.some(
        (c: any) => c.email.toLowerCase() === clientEmail.toLowerCase().trim() && c.password === clientPassword
      );
      if (matchesArray) return true;

      // Check in legacy/fallback theme fields
      if (metadata.clientEmail && metadata.clientPassword) {
        if (metadata.clientEmail.toLowerCase() === clientEmail.toLowerCase().trim() && metadata.clientPassword === clientPassword) {
          return true;
        }
      }
    }
  }

  return false;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const isAuthed = await checkClientAuth(projectId, req);

    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contactSubmissions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const metadata = themeObj.metadata || {};

    return NextResponse.json({
      success: true,
      name: project.name,
      logoUrl: metadata.logoUrl || themeObj.logoUrl || "",
      submissions: project.contactSubmissions
    });
  } catch (error: any) {
    console.error("Client dashboard GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const isAuthed = await checkClientAuth(projectId, req);

    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, logoUrl } = body;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const metadata = themeObj.metadata || {};

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name || project.name,
        theme: {
          ...themeObj,
          metadata: {
            ...metadata,
            logoUrl: logoUrl !== undefined ? logoUrl : (metadata.logoUrl || "")
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      name: updated.name,
      logoUrl: (updated.theme as any).metadata?.logoUrl || ""
    });
  } catch (error: any) {
    console.error("Client dashboard POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
