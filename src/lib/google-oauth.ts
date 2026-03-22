/**
 * Google OAuth client credentials — ใช้ชุดเดียวกันทุกที่ (auth, refresh, googleapis)
 */
export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId =
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export type GoogleRefreshResult = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

/**
 * แลก refresh_token → access token ใหม่ (ใช้ร่วมกับ jwt callback และ getValidGoogleAccessToken)
 */
export async function refreshGoogleOAuthTokens(
  refreshToken: string,
  creds: { clientId: string; clientSecret: string },
): Promise<GoogleRefreshResult | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = (await response.json()) as GoogleRefreshResult & {
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !data.access_token) {
      console.error("Google token refresh failed:", data);
      return null;
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in ?? 3600,
      ...(data.refresh_token && { refresh_token: data.refresh_token }),
    };
  } catch (e) {
    console.error("Google token refresh request error:", e);
    return null;
  }
}
