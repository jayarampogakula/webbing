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
        console.warn("CNAME verification lookup failed, checking A/ALIAS records mapping:", dnsErr);
      }

      // A / ALIAS record IP mapping comparison check
      if (!verified) {
        try {
          const [targetIps, systemIps, backupIps] = await Promise.all([
            dns.promises.resolve4(hostname).catch(() => []),
            dns.promises.resolve4("cname.webbing.in").catch(() => []),
            dns.promises.resolve4("webbing.in").catch(() => []),
          ]);

          const combinedSystemIps = Array.from(
            new Set([...systemIps, ...backupIps, "187.127.172.170", "2.57.91.91"])
          );

          if (targetIps.some((ip) => combinedSystemIps.includes(ip))) {
            verified = true;
          }
        } catch (aErr) {
          console.warn("A/ALIAS IP mapping check failed:", aErr);
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
