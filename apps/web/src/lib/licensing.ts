export function isValidLicenseKey(key: string): boolean {
  if (!key) return false;
  const clean = key.trim();
  
  // 1. Envato Purchase Code / CodeCanyon License Key format check (UUIDv4)
  const envatoRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (envatoRegex.test(clean)) {
    return true;
  }

  // 2. Custom direct activation license key check (WEBBING-XXXX-XXXX-XXXX-XXXX)
  const customRegex = /^WEBBING-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
  if (customRegex.test(clean)) {
    return true;
  }

  return false;
}

export function generateCustomLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = (length: number) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `WEBBING-${part(4)}-${part(4)}-${part(4)}-${part(4)}`;
}

export async function verifyLicenseOnline(key: string, domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanKey = key.trim();
    if (!isValidLicenseKey(cleanKey)) {
      return { success: false, error: "Invalid license key format." };
    }

    const centralServer = process.env.CENTRAL_LICENSE_SERVER || "https://webbing.in";
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

    // If the host itself matches the central server, execute direct database checks to bypass HTTP calls
    const isCentralServer = cleanDomain === "webbing.in" || cleanDomain === "localhost" || cleanDomain.includes("webbing.in");

    if (isCentralServer) {
      const { prisma } = await import("@webbing/db");

      const customRegex = /^WEBBING-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
      const isCustomKey = customRegex.test(cleanKey);

      const envatoRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isEnvatoKey = envatoRegex.test(cleanKey);

      if (!isCustomKey && !isEnvatoKey) {
        return { success: false, error: "Invalid license key format." };
      }

      if (isEnvatoKey) {
        // Automatically activate Envato purchase codes locally on the central server itself
        await prisma.centralLicense.upsert({
          where: { licenseKey: cleanKey },
          update: { domain: cleanDomain, status: "ACTIVE" },
          create: { licenseKey: cleanKey, domain: cleanDomain, status: "ACTIVE", type: "ENVATO" }
        });
        return { success: true };
      }

      const existing = await prisma.centralLicense.findUnique({
        where: { licenseKey: cleanKey }
      });

      if (!existing) {
        return { success: false, error: "License key does not exist on the licensing server." };
      }
      if (existing.status === "REVOKED") {
        return { success: false, error: "License has been revoked." };
      }
      if (existing.domain && existing.domain !== cleanDomain) {
        return { success: false, error: `License is already locked to domain: ${existing.domain}` };
      }

      if (!existing.domain) {
        await prisma.centralLicense.update({
          where: { id: existing.id },
          data: { domain: cleanDomain }
        });
      }
      return { success: true };
    }

    // Ping the central server for validation
    const res = await fetch(`${centralServer}/api/license/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: cleanKey, domain: cleanDomain }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || "Licensing server verification failed." };
    }

    return { success: data.success, error: data.error };
  } catch (error: any) {
    console.error("Online verification error:", error);
    return { success: false, error: "Unable to reach the central licensing server. Please check your internet connection." };
  }
}

