import { prisma } from "@/lib/prisma";
import {
  getGoogleOAuthCredentials,
  refreshGoogleOAuthTokens,
} from "@/lib/google-oauth";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Returns a valid Google OAuth access token for the user.
 * Refreshes when expired or within 5 minutes of expiry; persists to DB.
 * Returns null if missing, expired without refresh, or refresh failed (no stale tokens).
 */
export async function getValidGoogleAccessToken(
  userId: string,
): Promise<string | null> {
  const creds = getGoogleOAuthCredentials();
  if (!creds) {
    console.error(
      "getValidGoogleAccessToken: Google OAuth credentials not configured (AUTH_GOOGLE_* or GOOGLE_*)",
    );
    return null;
  }

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account?.access_token) return null;

  const expiresAtMs = account.expires_at ? account.expires_at * 1000 : 0;
  const now = Date.now();

  if (expiresAtMs > 0 && now < expiresAtMs - FIVE_MINUTES_MS) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    return null;
  }

  const refreshed = await refreshGoogleOAuthTokens(
    account.refresh_token,
    creds,
  );
  if (!refreshed) {
    return null;
  }

  const newExpiresAt = Math.floor(
    (Date.now() + refreshed.expires_in * 1000) / 1000,
  );

  await prisma.account.updateMany({
    where: { userId, provider: "google" },
    data: {
      access_token: refreshed.access_token,
      expires_at: newExpiresAt,
      ...(refreshed.refresh_token && { refresh_token: refreshed.refresh_token }),
    },
  });

  return refreshed.access_token;
}
