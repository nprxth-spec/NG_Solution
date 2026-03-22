// lib/auth.ts — full server-side auth with Prisma adapter
// DO NOT import this in middleware.ts (not Edge-compatible)
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT strategy: session token is a JWT, readable by Edge middleware
  // without needing database access
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            // Read all Drive files the user can access
            "https://www.googleapis.com/auth/drive.readonly",
            // Create/update files in Drive (needed for upload)
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/spreadsheets",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // jwt callback runs when token is created/updated
    async jwt({ token, user, account }) {
      if (account && user) {
        // New sign-in (first time or re-login) — save Google tokens to JWT and to DB
        // Important: on re-login with more scopes, we must overwrite DB so API calls use the new token
        token.userId = user.id;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : 0;

        const accountData: Record<string, unknown> = {};
        if (account.access_token != null) accountData.access_token = account.access_token;
        if (account.refresh_token != null) accountData.refresh_token = account.refresh_token;
        if (account.expires_at != null) accountData.expires_at = account.expires_at;
        const scope = (account as { scope?: string }).scope;
        if (scope != null) accountData.scope = scope;
        if (Object.keys(accountData).length > 0) {
          await prisma.account.updateMany({
            where: { userId: user.id, provider: "google" },
            data: accountData as any,
          });
        }
      }

      // On subsequent calls, fetch fresh credits, sheetId, and access_token if missing
      if (token.userId) {
        let currentAccessToken = token.accessToken as string | undefined;
        let expiresAt = token.expiresAt as number | undefined;

        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: {
            credits: true,
            plan: true,
            sheetId: true,
            sheetName: true,
            sheetMapping: true,
            filenameMapping: true,
            sheetProfiles: true,
            activeSheetProfileId: true,
            driveFolderId: true,
            accounts: {
              where: { provider: "google" },
              select: { access_token: true, refresh_token: true, expires_at: true },
            },
          },
        });

        if (dbUser) {
          token.credits = dbUser.credits;
          (token as any).plan = dbUser.plan;
          token.sheetId = dbUser.sheetId;
          token.sheetName = dbUser.sheetName;
          token.sheetMapping = dbUser.sheetMapping;
          token.filenameMapping = dbUser.filenameMapping;
          (token as any).sheetProfiles = dbUser.sheetProfiles;
          (token as any).activeSheetProfileId = dbUser.activeSheetProfileId;
          (token as any).driveFolderId = dbUser.driveFolderId;

          const dbAccount = dbUser.accounts[0];
          if (dbAccount) {
            // Use DB tokens (now updated on re-login so they match the latest consent)
            currentAccessToken = dbAccount.access_token || currentAccessToken;
            token.refreshToken = dbAccount.refresh_token || token.refreshToken;
            expiresAt = dbAccount.expires_at ? dbAccount.expires_at * 1000 : expiresAt;
          }
        }

        // Check if token is expired (or expires in the next 5 minutes)
        if (currentAccessToken && expiresAt && Date.now() > expiresAt - 5 * 60 * 1000) {
          try {
            const refreshToken = token.refreshToken as string;
            if (refreshToken) {
              const url = "https://oauth2.googleapis.com/token";
              const response = await fetch(url, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                method: "POST",
                body: new URLSearchParams({
                  client_id: process.env.GOOGLE_CLIENT_ID!,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                  grant_type: "refresh_token",
                  refresh_token: refreshToken,
                }),
              });

              const tokens = await response.json();
              if (response.ok) {
                currentAccessToken = tokens.access_token;
                expiresAt = Date.now() + tokens.expires_in * 1000;
                
                // Save new token to DB
                await prisma.account.updateMany({
                  where: { userId: token.userId as string, provider: "google" },
                  data: { 
                    access_token: currentAccessToken,
                    expires_at: Math.floor(expiresAt / 1000),
                    ...(tokens.refresh_token && { refresh_token: tokens.refresh_token })
                  }
                });
              }
            }
          } catch (error) {
            console.error("Error refreshing Google access token", error);
          }
        }

        token.accessToken = currentAccessToken;
        token.expiresAt = expiresAt;
      }
      return token;
    },
    // session callback shapes what useSession() returns
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        (session as any).accessToken = token.accessToken;
        (session.user as any).credits = token.credits;
        (session.user as any).plan = (token as any).plan;
        (session.user as any).sheetId = token.sheetId;
        (session.user as any).sheetName = token.sheetName;
        (session.user as any).sheetMapping = token.sheetMapping;
        (session.user as any).filenameMapping = token.filenameMapping;
        (session.user as any).sheetProfiles = (token as any).sheetProfiles;
        (session.user as any).activeSheetProfileId = (token as any).activeSheetProfileId;
        (session.user as any).driveFolderId = (token as any).driveFolderId;
      }
      return session;
    },
  },
});
