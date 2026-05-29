import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";
import dns from "dns";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const customDomain = await prisma.customDomain.findUnique({
      where: { projectId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Custom domain mapping not found." }, { status: 404 });
    }

    const hostname = customDomain.hostname;
    let verified = false;

    // Auto-approve during local testing, development, or for localhost domains
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      process.env.NODE_ENV === "development"
    ) {
      verified = true;
    } else {
      try {
        const resolved = await dns.promises.resolveCname(hostname);
        if (
          resolved.some(
            (cname) =>
              cname.includes("cname.webbing.in") ||
              cname.includes("webbing.in") ||
              cname.includes("cname.webbing.io")
          )
        ) {
          verified = true;
        }
      } catch (dnsErr) {
        console.warn("CNAME verification lookup failed, trying A record fallback:", dnsErr);
        try {
          const resolvedA = await dns.promises.resolve4(hostname);
          if (resolvedA.length > 0) {
            verified = true;
          }
        } catch (aErr) {
          console.warn("A record lookup failed:", aErr);
        }
      }
    }

    if (verified) {
      await prisma.customDomain.update({
        where: { projectId },
        data: { verified: true, sslStatus: "ACTIVE" },
      });
      return NextResponse.json({ success: true, message: "Success! Domain connected." });
    } else {
      return NextResponse.json({
        success: false,
        message: "DNS connection check failed. Ensure CNAME points to cname.webbing.in",
      });
    }
  } catch (error: any) {
    console.error("Custom domain verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
