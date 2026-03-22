const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

function getSigningSecret(): string | null {
  if (process.env.NODE_ENV === "production") {
    return process.env.ADMIN_SESSION_TOKEN ?? null;
  }
  return process.env.ADMIN_SESSION_TOKEN ?? "dev-admin-session-signing-secret";
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(b64url: string): string {
  const pad = b64url.length % 4;
  const b64 =
    b64url.replace(/-/g, "+").replace(/_/g, "/") +
    (pad ? "=".repeat(4 - pad) : "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let out = 0;
  for (let i = 0; i < ea.length; i++) out |= ea[i]! ^ eb[i]!;
  return out === 0;
}

async function hmacSha256B64Url(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * สร้างค่า cookie `admin_session` — แต่ละครั้งล็อกอินได้ token ไม่ซ้ำ (HMAC บน payload)
 */
export async function createAdminSessionCookieValue(): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const exp = Date.now() + EIGHT_HOURS_MS;
  const jti = crypto.randomUUID();
  const payload = JSON.stringify({ exp, jti });
  const b64 = utf8ToBase64Url(payload);
  const sig = await hmacSha256B64Url(secret, b64);
  return `${b64}.${sig}`;
}

/**
 * ตรวจ cookie แอดมิน (ใช้ใน proxy/middleware และ API routes — ไม่ใช้ node:crypto เพื่อรองรับ Edge)
 */
export async function verifyAdminSessionCookie(
  value: string | undefined,
): Promise<boolean> {
  const secret = getSigningSecret();
  if (!secret || !value?.includes(".")) return false;

  const dot = value.indexOf(".");
  const b64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!b64 || !sig) return false;

  const expected = await hmacSha256B64Url(secret, b64);
  if (!timingSafeEqualStr(sig, expected)) return false;

  try {
    const json = JSON.parse(base64UrlToUtf8(b64)) as { exp?: number };
    if (typeof json.exp !== "number" || json.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
