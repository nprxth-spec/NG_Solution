import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google-auth";

const CACHE_REVALIDATE_SECONDS = 120; // 2 นาที

async function fetchFolderMeta(userId: string, id: string) {
  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) throw new Error("Google access token missing");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const names: string[] = [];
  let currentId: string | null = id;
  let guard = 0;

  while (currentId && guard < 10) {
    guard += 1;
    const res: any = await drive.files.get({
      fileId: currentId,
      fields: "id, name, parents",
      supportsAllDrives: true,
    });
    const name = res.data.name || currentId;
    names.unshift(name);
    const parents = res.data.parents;
    if (!parents || parents.length === 0) break;
    currentId = parents[0] || null;
  }

  const fullPath = names.join(" > ");
  return { id, name: names[names.length - 1] || "", path: fullPath };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    const data = await unstable_cache(
      async () => fetchFolderMeta(userId, id),
      ["folder-meta", userId, id],
      { revalidate: CACHE_REVALIDATE_SECONDS, tags: [`user-folder-${userId}`] }
    )();
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Failed to fetch folder metadata:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch folder metadata" },
      { status: 500 }
    );
  }
}

