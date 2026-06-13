import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return new NextResponse("Domain parameter required", { status: 400 });
  }

  try {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, "");

    // 1. If it's a standard subdomain of webbing.in, webbing.io, or cursorwebs.com, approve if the project exists and is published
    if (cleanDomain.endsWith(".webbing.in") || cleanDomain.endsWith(".webbing.io") || cleanDomain.endsWith(".cursorwebs.com")) {
      const subdomain = cleanDomain.replace(/\.(webbing\.(in|io)|cursorwebs\.com)$/, "");
      const project = await prisma.project.findUnique({
        where: { subdomain }
      });
      if (project && project.status === "PUBLISHED") {
        console.log(`Caddy TLS Check: Approved certificate issuance for subdomain ${cleanDomain}`);
        return new NextResponse("Approved", { status: 200 });
      }
    }

    // 2. Lookup the domain in the custom domain list
    const record = await prisma.customDomain.findUnique({
      where: { hostname: cleanDomain },
      include: { project: true }
    });

    // Verify mapping and DNS verification status
    if (record && record.verified) {
      console.log(`Caddy TLS Check: Approved certificate issuance for custom domain ${cleanDomain}`);
      return new NextResponse("Approved", { status: 200 });
    }

    console.warn(`Caddy TLS Check: Denied certificate issuance for ${cleanDomain}`);
    return new NextResponse("Domain not verified or not configured", { status: 400 });
  } catch (error) {
    console.error("Caddy TLS Check Exception:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
