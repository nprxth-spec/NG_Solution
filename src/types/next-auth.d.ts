import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      credits?: number;
      plan?: string;
      sheetId?: string | null;
      sheetName?: string | null;
      sheetMapping?: any;
      filenameMapping?: any;
      sheetProfiles?: any;
      activeSheetProfileId?: string | null;
      driveFolderId?: string | null;
      connectedProviders?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    credits?: number;
    plan?: string;
    sheetId?: string | null;
    sheetName?: string | null;
    sheetMapping?: any;
    filenameMapping?: any;
    sheetProfiles?: any;
    activeSheetProfileId?: string | null;
    driveFolderId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    credits?: number;
    plan?: string;
    sheetId?: string | null;
    sheetName?: string | null;
    sheetMapping?: any;
    filenameMapping?: any;
    sheetProfiles?: any;
    activeSheetProfileId?: string | null;
    driveFolderId?: string | null;
    connectedProviders?: string[];
  }
}
