import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return new NextResponse("Domain parameter required", { status: 400 });
  }

  try {
    // Lookup the domain in the custom domain list
    const record = await prisma.customDomain.findUnique({
      where: { hostname: domain },
      include: { project: true }
    });

    // Verify mapping and DNS verification status
    if (record && record.verified) {
      console.log(`Caddy TLS Check: Approved certificate issuance for ${domain}`);
      return new NextResponse("Approved", { status: 200 });
    }

    console.warn(`Caddy TLS Check: Denied certificate issuance for ${domain}`);
    return new NextResponse("Domain not verified or not configured", { status: 400 });
  } catch (error) {
    console.error("Caddy TLS Check Exception:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
