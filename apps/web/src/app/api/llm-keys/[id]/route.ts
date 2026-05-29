import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

function getUser() {
  const sessionToken = cookies().get("webbing-session")?.value;
  return sessionToken ? verifySession(sessionToken) : null;
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await prisma.llmApiKey.findUnique({ where: { id: params.id } }).catch((error) => {
    console.error("LLM key table is not ready yet:", error);
    return null;
  });
  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const canDelete = user.role === "ADMIN" || key.ownerUserId === user.userId;
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.llmApiKey.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
