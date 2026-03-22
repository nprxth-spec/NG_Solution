import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google-auth";

// Lists folders under a given parent folder in Google Drive.
// Query: ?parentId=<folderId>
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");

  if (!parentId) {
    return NextResponse.json({ error: "Missing parentId parameter" }, { status: 400 });
  }

  const accessToken = await getValidGoogleAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google access token missing. Please sign in again." },
      { status: 401 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const resDrive = await drive.files.list({
      q: `'${parentId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType)",
      orderBy: "name_natural",
      spaces: "drive",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    const folders =
      resDrive.data.files?.map((f) => ({
        id: f.id ?? "",
        name: f.name ?? "",
      })) ?? [];

    return NextResponse.json({ data: folders });
  } catch (err: any) {
    console.error("Failed to list drive folders:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to list drive folders" },
      { status: 500 }
    );
  }
}

