import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";

function normalizeDomain(url: string): string {
  if (!url) return "";
  let clean = url.trim().toLowerCase();
  
  // Remove protocol and www prefix
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
  
  // Remove port or path
  const slashIndex = clean.indexOf("/");
  if (slashIndex !== -1) {
    clean = clean.slice(0, slashIndex);
  }
  const colonIndex = clean.indexOf(":");
  if (colonIndex !== -1) {
    clean = clean.slice(0, colonIndex);
  }
  
  return clean;
}

export async function POST(req: Request) {
  try {
    const { licenseKey, domain } = await req.json();

    if (!licenseKey) {
      return NextResponse.json({ success: false, error: "License key is required." }, { status: 400 });
    }

    const cleanKey = licenseKey.trim();
    const cleanDomain = normalizeDomain(domain || "");

    // 1. Check if the key matches a Custom License format (WEBBING-XXXX-XXXX-XXXX-XXXX)
    const customRegex = /^WEBBING-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    const isCustomKey = customRegex.test(cleanKey);

    // 2. Check if the key matches an Envato Purchase Code format (UUIDv4)
    const envatoRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isEnvatoKey = envatoRegex.test(cleanKey);

    if (!isCustomKey && !isEnvatoKey) {
      return NextResponse.json({ success: false, error: "Invalid license key format." }, { status: 400 });
    }

    // --- CASE A: Envato Purchase Code verification ---
    if (isEnvatoKey) {
      const envatoToken = process.env.ENVATO_API_KEY || process.env.ENVATO_PERSONAL_TOKEN;

      if (envatoToken) {
        try {
          // Verify with Envato API
          const response = await fetch(`https://api.envato.com/v3/market/author/sale?code=${cleanKey}`, {
            headers: {
              Authorization: `Bearer ${envatoToken}`,
              "User-Agent": "Webbing License Validator",
            },
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return NextResponse.json({
              success: false,
              error: errData.description || "The Envato purchase code is invalid or could not be verified with CodeCanyon.",
            }, { status: 400 });
          }
        } catch (err) {
          console.error("Envato API connection error:", err);
          // If Envato API is down, fallback to local DB check so we don't lock out valid buyers
        }
      }

      // Check database to enforce single-domain activation
      const existingLicense = await prisma.centralLicense.findUnique({
        where: { licenseKey: cleanKey },
      });

      if (existingLicense) {
        if (existingLicense.status === "REVOKED") {
          return NextResponse.json({ success: false, error: "This license key has been revoked." }, { status: 403 });
        }
        
        if (existingLicense.domain && cleanDomain && existingLicense.domain !== cleanDomain) {
          return NextResponse.json({
            success: false,
            error: `This purchase code is already active on another domain (${existingLicense.domain}). Please purchase an additional license or transfer the activation.`,
          }, { status: 409 });
        }

        // If domain matches or is not yet set, update/confirm
        if (!existingLicense.domain && cleanDomain) {
          await prisma.centralLicense.update({
            where: { id: existingLicense.id },
            data: { domain: cleanDomain },
          });
        }
      } else {
        // Log the first-time activation of this Envato purchase code in the database
        await prisma.centralLicense.create({
          data: {
            licenseKey: cleanKey,
            status: "ACTIVE",
            type: "ENVATO",
            domain: cleanDomain || null,
            notes: "Auto-registered on first activation",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "License verified successfully.",
      });
    }

    // --- CASE B: Custom Direct Activation Key verification ---
    if (isCustomKey) {
      const existingLicense = await prisma.centralLicense.findUnique({
        where: { licenseKey: cleanKey },
      });

      if (!existingLicense) {
        return NextResponse.json({ success: false, error: "License key does not exist on the licensing server." }, { status: 404 });
      }

      if (existingLicense.status === "REVOKED") {
        return NextResponse.json({ success: false, error: "This license key has been revoked." }, { status: 403 });
      }

      if (existingLicense.domain && cleanDomain && existingLicense.domain !== cleanDomain) {
        return NextResponse.json({
          success: false,
          error: `This license is already active on another domain (${existingLicense.domain}).`,
        }, { status: 409 });
      }

      // If domain is not yet set, register/lock it
      if (!existingLicense.domain && cleanDomain) {
        await prisma.centralLicense.update({
          where: { id: existingLicense.id },
          data: { domain: cleanDomain },
        });
      }

      return NextResponse.json({
        success: true,
        message: "License verified successfully.",
      });
    }

    return NextResponse.json({ success: false, error: "Verification failed." }, { status: 500 });
  } catch (error: any) {
    console.error("License validation endpoint error:", error);
    return NextResponse.json({ success: false, error: "Internal licensing server error." }, { status: 500 });
  }
}
