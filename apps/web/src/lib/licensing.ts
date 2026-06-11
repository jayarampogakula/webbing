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
