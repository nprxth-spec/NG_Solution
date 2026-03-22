import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-log";
import { BILLING_PLANS } from "@/lib/billing-plans";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

if (!process.env.AUTH_SECRET) {
  console.warn("WARNING: AUTH_SECRET is not defined in environment variables!");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = (await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })) as any;

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/spreadsheets",
          ].join(" "),
          access_type: "offline",
          prompt: "consent select_account",
        },
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/spreadsheets",
          ].join(" "),
          access_type: "offline",
          prompt: "consent select_account",
        },
      },
    }),
  ],
  events: {
    async linkAccount({ account, user }) {
      // Logic for linking can be added here if needed for Google or others
    },
  },
  callbacks: {
    async jwt({ token, user, account }): Promise<any> {
      if (user) {
        token.userId = user.id;
        token.credits = (user as any).credits;
        token.plan = (user as any).plan;
      }

      if (account && user) {
        const accountData: any = {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
        };
        
        await prisma.account.updateMany({
          where: { userId: user.id, provider: account.provider },
          data: accountData,
        });

        if (account.provider === "google") {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
        }
      }

      if (token.userId) {
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
              select: { provider: true, access_token: true, refresh_token: true, expires_at: true },
            },
          },
        });

        if (dbUser) {
          token.credits = dbUser.credits;
          token.plan = dbUser.plan;
          token.sheetId = dbUser.sheetId;
          token.sheetName = dbUser.sheetName;
          token.sheetMapping = dbUser.sheetMapping;
          token.filenameMapping = dbUser.filenameMapping;
          token.sheetProfiles = dbUser.sheetProfiles;
          token.activeSheetProfileId = dbUser.activeSheetProfileId;
          token.driveFolderId = dbUser.driveFolderId;
          token.connectedProviders = dbUser.accounts.map((a: any) => a.provider);

          const googleAccount = dbUser.accounts.find((a: any) => a.provider === "google");
          if (googleAccount) {
            token.accessToken = googleAccount.access_token || (token.accessToken as string);
            token.refreshToken = googleAccount.refresh_token || (token.refreshToken as string);
            token.expiresAt = googleAccount.expires_at ? googleAccount.expires_at * 1000 : (token.expiresAt as number);
          }
        }

        if (token.accessToken && token.expiresAt && Date.now() > (token.expiresAt as number) - 5 * 60 * 1000) {
          try {
            const refreshToken = token.refreshToken as string;
            if (refreshToken) {
              const url = "https://oauth2.googleapis.com/token";
              const response = await fetch(url, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                method: "POST",
                body: new URLSearchParams({
                  client_id: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
                  client_secret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
                  grant_type: "refresh_token",
                  refresh_token: refreshToken,
                }),
              });

              const tokens = await response.json();
              if (response.ok) {
                token.accessToken = tokens.access_token;
                token.expiresAt = Date.now() + tokens.expires_in * 1000;
                
                await prisma.account.updateMany({
                  where: { userId: token.userId as string, provider: "google" },
                  data: { 
                    access_token: tokens.access_token,
                    expires_at: Math.floor((token.expiresAt as number) / 1000),
                    ...(tokens.refresh_token && { refresh_token: tokens.refresh_token })
                  }
                });
              }
            }
          } catch (error) {
            console.error("Error refreshing Google access token", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string;
        session.user.credits = token.credits as number;
        session.user.plan = token.plan as string;
        session.user.sheetId = token.sheetId as string;
        session.user.sheetName = token.sheetName as string;
        session.user.sheetMapping = token.sheetMapping;
        session.user.filenameMapping = token.filenameMapping;
        session.user.sheetProfiles = token.sheetProfiles;
        session.user.activeSheetProfileId = token.activeSheetProfileId as string;
        session.user.driveFolderId = token.driveFolderId as string;
        session.user.connectedProviders = token.connectedProviders as string[];
      }
      return session;
    },
    async signIn({ user, account }: any) {
      if (!user.email) return true;

      if (account?.provider === "google" && account.id_token) {
        try {
          const [, payloadB64] = account.id_token.split(".");
          if (payloadB64) {
            const payloadJson = Buffer.from(payloadB64, "base64").toString("utf8");
            const payload = JSON.parse(payloadJson) as { picture?: string };
            if (payload.picture) {
              await prisma.user.update({
                where: { id: user.id },
                data: { image: payload.picture },
              });
            }
          }
        } catch (e) {
          console.error("Failed to persist Google profile image from id_token:", e);
        }
      }

      try {
        const email = user.email;
        if (email) {
          const existing = await prisma.trialHistory.findUnique({
            where: { email },
          });
          if (!existing) {
            const now = new Date();
            await prisma.trialHistory.create({
              data: {
                email,
                firstSignupAt: now,
                freeTrialStartedAt: now,
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to ensure TrialHistory on signIn:", e);
      }

      // Initialize credits for first-time login
      try {
        if (user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, lastCreditsReset: true }
          });
          if (dbUser && dbUser.lastCreditsReset === null) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                credits: BILLING_PLANS.free.creditsPerMonth || 100,
                lastCreditsReset: new Date()
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to initialize user credits on signIn:", e);
      }

      await logActivity({
        userId: user.id!,
        action: "login",
        category: "auth",
        metadata: {
          provider: account?.provider,
        },
      });

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

