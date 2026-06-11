import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma, LlmKeyScope, LlmProvider } from "@webbing/db";
import { verifySession } from "@/lib/session";
import * as z from "zod";

const providers = Object.values(LlmProvider) as [string, ...string[]];

const keySchema = z.object({
  provider: z.enum(providers),
  label: z.string().min(2).max(80),
  apiKey: z.string().min(6).max(2000),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().max(120).optional().or(z.literal("")),
  scope: z.enum(["GLOBAL", "USER"]).default("USER"),
});

function maskKey(key: string) {
  const clean = key.trim();
  if (clean.length <= 10) return `${clean.slice(0, 2)}...${clean.slice(-2)}`;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

function getUser() {
  const sessionToken = cookies().get("webbing-session")?.value;
  return sessionToken ? verifySession(sessionToken) : null;
}

export async function GET() {
  const user = getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await prisma.llmApiKey.findMany({
      where: {
        scope: LlmKeyScope.USER,
        ownerUserId: user.userId,
      },
      orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        provider: true,
        label: true,
        maskedKey: true,
        baseUrl: true,
        model: true,
        scope: true,
        ownerUserId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("LLM key table is not ready yet:", error);
    return NextResponse.json({ keys: [] });
  }
}

export async function POST(req: Request) {
  const user = getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = keySchema.parse(await req.json());
  const scope = payload.scope === "GLOBAL" && user.role === "ADMIN" ? LlmKeyScope.GLOBAL : LlmKeyScope.USER;

  try {
    const key = await prisma.llmApiKey.create({
      data: {
        provider: payload.provider as LlmProvider,
        label: payload.label.trim(),
        secret: payload.apiKey.trim(),
        maskedKey: maskKey(payload.apiKey),
        baseUrl: payload.baseUrl || null,
        model: payload.model || null,
        scope,
        ownerUserId: scope === LlmKeyScope.USER ? user.userId : null,
        createdById: user.userId,
      },
      select: {
        id: true,
        provider: true,
        label: true,
        maskedKey: true,
        baseUrl: true,
        model: true,
        scope: true,
        ownerUserId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ key });
  } catch (error) {
    console.error("Unable to save LLM key:", error);
    return NextResponse.json({ error: "LLM key storage is not ready. Please run the latest database migration." }, { status: 503 });
  }
}
