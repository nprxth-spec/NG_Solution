import { prisma } from "@/lib/db";
import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google-auth";
import { getGoogleOAuthCredentials } from "@/lib/google-oauth";

const FB_EXPIRY_SKEW_MS = 5 * 60 * 1000;

/** ดึง access_token ของ provider จาก Account table */
export async function getProviderToken(userId: string, provider: "google" | "facebook") {
  const account = await prisma.account.findFirst({
    where: { userId, provider },
    select: { access_token: true, refresh_token: true, expires_at: true },
  });
  if (!account?.access_token) return null;
  return account;
}

function isFacebookTokenUsable(expiresAt: number | null | undefined): boolean {
  if (expiresAt == null) return false;
  const expMs = expiresAt * 1000;
  return Date.now() < expMs - FB_EXPIRY_SKEW_MS;
}

/** สร้าง Google OAuth2 client พร้อม access token ที่ต่ออายุแล้ว (ไม่ใช้โทเค็นเก่าจาก DB โดยตรง) */
export async function getGoogleClient(userId: string) {
  const creds = getGoogleOAuthCredentials();
  if (!creds) return null;

  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) return null;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { refresh_token: true, expires_at: true },
  });

  const hasRefreshToken = !!account?.refresh_token;

  const oauth2 = new google.auth.OAuth2(creds.clientId, creds.clientSecret);

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: hasRefreshToken ? account?.refresh_token ?? undefined : undefined,
    expiry_date:
      hasRefreshToken && account?.expires_at
        ? account.expires_at * 1000
        : undefined,
  });

  // Auto-refresh ถ้า token หมดอายุ และอัปเดตใน DB
  oauth2.on("tokens", async (tokens) => {
    try {
      const updateData: {
        access_token?: string | null;
        refresh_token?: string | null;
        expires_at?: number | null;
      } = {};

      if (tokens.access_token) {
        updateData.access_token = tokens.access_token;
      }

      if (tokens.refresh_token) {
        // บางครั้ง Google จะ rotate refresh token ใหม่ให้
        // ถ้าเราไม่บันทึกตัวใหม่ ตัวเก่าจะใช้ไม่ได้และทำให้เกิด invalid_grant
        updateData.refresh_token = tokens.refresh_token;
      }

      if (typeof tokens.expiry_date === "number") {
        updateData.expires_at = Math.floor(tokens.expiry_date / 1000);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.account.updateMany({
          where: { userId, provider: "google" },
          data: updateData,
        });
      }
    } catch (e) {
      console.error("Failed to persist Google tokens", e);
    }
  });

  return oauth2;
}

/**
 * Facebook long-lived token — คืนค่าเฉพาะเมื่อยังไม่หมดอายุ (ไม่ส่งโทเค็นเก่าไป Graph API)
 */
export async function getFacebookToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "facebook" },
    select: { access_token: true, expires_at: true },
    orderBy: { id: "asc" },
  });
  if (!account?.access_token) return null;
  if (!isFacebookTokenUsable(account.expires_at)) return null;
  return account.access_token;
}

/** ดึง Facebook access token ทุกบัญชีที่ user เชื่อมต่อ (เฉพาะที่ยังไม่หมดอายุ) */
export async function getAllFacebookTokens(userId: string): Promise<{ providerAccountId: string; token: string }[]> {
  const accounts = await prisma.account.findMany({
    where: { userId, provider: "facebook" },
    select: { providerAccountId: true, access_token: true, expires_at: true },
  });
  return accounts
    .filter(
      (a): a is { providerAccountId: string; access_token: string; expires_at: number | null } =>
        !!a.access_token && isFacebookTokenUsable(a.expires_at),
    )
    .map((a) => ({ providerAccountId: a.providerAccountId, token: a.access_token }));
}

/** แลกเปลี่ยน Short-lived Facebook token เป็น Long-lived token (60 วัน) */
export async function exchangeFacebookToken(shortToken: string) {
  const appId = process.env.AUTH_FACEBOOK_ID;
  const appSecret = process.env.AUTH_FACEBOOK_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Facebook configuration missing");
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    })
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    access_token: data.access_token as string,
    expires_in: data.expires_in as number, // usually around 5184000 (60 days)
  };
}
