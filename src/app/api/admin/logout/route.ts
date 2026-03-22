import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  await logActivity({
    req,
    action: "admin_logout",
    category: "admin",
  });

  return res;
}

