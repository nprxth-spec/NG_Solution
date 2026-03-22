import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getValidGoogleAccessToken } from "@/lib/google-auth";

/** Scopes the app requests at login (must all be granted for Drive + Sheets to work). */
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json({
      ok: false,
      error: "no_google_account",
      message: "ไม่มีบัญชี Google หรือไม่มีโทเค็น",
      granted: [],
      missing: [...REQUIRED_SCOPES],
    });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: "tokeninfo_failed",
        message: data.error_description ?? data.error ?? "ตรวจสอบโทเค็นกับ Google ไม่ได้",
        granted: [],
        missing: [...REQUIRED_SCOPES],
      });
    }

    const scopeStr = (data.scope as string) || "";
    const granted = scopeStr.split(/\s+/).filter(Boolean);
    const missing = REQUIRED_SCOPES.filter((s) => !granted.includes(s));
    const okScopes = missing.length === 0;

    return NextResponse.json({
      ok: okScopes,
      granted,
      missing,
      message: okScopes
        ? "สโคปครบทุกสิทธิ์ที่แอปใช้"
        : `ขาดสิทธิ์: ${missing.join(", ")}`,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: "request_failed",
      message: err?.message ?? "เกิดข้อผิดพลาด",
      granted: [],
      missing: [...REQUIRED_SCOPES],
    });
  }
}
