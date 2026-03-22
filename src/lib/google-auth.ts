import { prisma } from "@/lib/prisma";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Returns a valid Google OAuth access token for the user.
 * If the token in DB is expired (or expires within 5 min), refreshes it and saves to DB.
 * Use this in API routes that call Google APIs so they don't get "invalid authentication credentials".
 */
export async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account?.access_token) return null;

  const expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
  const now = Date.now();

  if (expiresAt && now < expiresAt - FIVE_MINUTES_MS) {
    return account.access_token;
  }

  const refreshToken = account.refresh_token;
  if (!refreshToken) return account.access_token;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const tokens = await response.json();
    if (!response.ok) {
      console.error("Google token refresh failed:", tokens);
      return account.access_token;
    }

    const newAccessToken = tokens.access_token;
    const newExpiresAt = Math.floor((Date.now() + (tokens.expires_in ?? 3600) * 1000) / 1000);

    await prisma.account.updateMany({
      where: { userId, provider: "google" },
      data: {
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
      },
    });

    return newAccessToken;
  } catch (err) {
    console.error("Error refreshing Google access token:", err);
    return account.access_token;
  }
}
