import { unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSpreadsheetTitle } from "@/lib/google";
import { getValidGoogleAccessToken } from "@/lib/google-auth";

const CACHE_REVALIDATE_SECONDS = 120; // 2 นาที

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get("sheetId");

    if (!sheetId) {
        return NextResponse.json({ error: "Missing sheetId parameter" }, { status: 400 });
    }

    const userId = session.user.id;
    const accessToken = await getValidGoogleAccessToken(userId);
    if (!accessToken) {
        return NextResponse.json(
            { error: "Google access token missing. Please sign in again." },
            { status: 401 }
        );
    }

    try {
        const title = await unstable_cache(
            async () => {
                const token = await getValidGoogleAccessToken(userId);
                if (!token) return "";
                return getSpreadsheetTitle(sheetId, token);
            },
            ["sheet-title", userId, sheetId],
            { revalidate: CACHE_REVALIDATE_SECONDS, tags: [`user-sheet-${userId}`] }
        )();
        return NextResponse.json({ data: { title } });
    } catch (err: any) {
        console.error("Failed to fetch spreadsheet title:", err);
        return NextResponse.json(
            { error: err.message ?? "Failed to fetch spreadsheet title" },
            { status: 500 }
        );
    }
}
