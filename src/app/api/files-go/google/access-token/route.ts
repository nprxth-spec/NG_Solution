import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getValidGoogleAccessToken } from "@/lib/google-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidGoogleAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Google access token missing. Please sign in again." },
      { status: 401 }
    );
  }

  return NextResponse.json({ data: { accessToken } });
}

