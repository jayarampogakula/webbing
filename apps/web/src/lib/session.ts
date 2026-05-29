import { createHmac } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-session-signing-key";

/**
 * Sign a session payload to produce an Edge-safe signed token.
 */
export function signSession(session: { userId: string; email: string; role: string; tenantId: string }): string {
  const data = Buffer.from(JSON.stringify(session)).toString("base64");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64");
  return `${data}.${signature}`;
}

/**
 * Verify and decode an Edge-safe signed session token.
 */
export function verifySession(token: string): { userId: string; email: string; role: string; tenantId: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  
  const expectedSig = createHmac("sha256", SECRET).update(data).digest("base64");
  if (signature !== expectedSig) return null;
  
  try {
    return JSON.parse(Buffer.from(data, "base64").toString());
  } catch {
    return null;
  }
}
