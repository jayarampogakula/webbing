import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
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

    const assets = await prisma.asset.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("GET Assets Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      where: { id: projectId, tenantId: user.tenantId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = (formData.get("filename") as string) || "upload-" + Date.now() + ".png";
    
    // Clean and make filename unique to avoid collisions
    const ext = path.extname(originalFilename) || ".png";
    const nameWithoutExt = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9-]/g, "_");
    const uniqueFilename = `${nameWithoutExt}-${Date.now()}${ext}`;

    // Determine correct public directory path
    let baseDir = process.cwd();
    let publicDir = path.join(baseDir, "public");
    if (!existsSync(publicDir) && existsSync(path.join(baseDir, "apps", "web", "public"))) {
      publicDir = path.join(baseDir, "apps", "web", "public");
    }
    const uploadsDir = path.join(publicDir, "uploads");

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    const asset = await prisma.asset.create({
      data: {
        projectId: projectId,
        url: fileUrl,
        key: `uploads/${uniqueFilename}`,
        fileSize: buffer.length,
        mimeType: file.type || "image/png"
      }
    });

    return NextResponse.json({
      success: true,
      asset
    });
  } catch (error: any) {
    console.error("POST Assets Exception:", error);
    return NextResponse.json({ error: error.message || "Failed to upload asset" }, { status: 500 });
  }
}
