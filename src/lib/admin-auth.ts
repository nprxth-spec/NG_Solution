import { createHmac } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "filesgo_admin";
const MAX_AGE_SEC = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set");
  return secret;
}

function hmacSha256(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createAdminToken(): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = JSON.stringify({ exp });
  const sig = hmacSha256(getSecret(), payload);
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return false;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    const expectedSig = hmacSha256(getSecret(), Buffer.from(payloadB64, "base64url").toString());
    return sig === expectedSig;
  } catch {
    return false;
  }
}

export async function getAdminCookie(): Promise<string | null> {
  const c = await cookies();
  return c.get(ADMIN_COOKIE_NAME)?.value ?? null;
}

export async function setAdminCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SEC,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const c = await cookies();
  c.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = await getAdminCookie();
  return !!token && verifyAdminToken(token);
}

export function checkAdminPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}
