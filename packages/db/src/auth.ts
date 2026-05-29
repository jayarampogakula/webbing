import { scryptSync, randomBytes, createHmac } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-session-signing-key";

/**
 * Hash a password using native crypto.scryptSync with a salt.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored scrypt hash.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = scryptSync(password, salt, 64).toString("hex");
  return hash === verifyHash;
}

/**
 * Sign a session payload to produce a tamper-proof token.
 */
export function signSession(session: { userId: string; email: string; role: string; tenantId: string }): string {
  const data = Buffer.from(JSON.stringify(session)).toString("base64");
  const signature = createHmac("sha256", SECRET).update(data).digest("base64");
  return `${data}.${signature}`;
}

/**
 * Verify and decode a tamper-proof session token.
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
