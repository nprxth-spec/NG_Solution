import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-log";
import { createAdminSessionCookieValue } from "@/lib/admin-session";
import {
  checkAdminLoginRateLimit,
  getRequestIp,
} from "@/lib/admin-login-rate-limit";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_SESSION_TOKEN) {
    return NextResponse.json(
      { error: "Admin session token is not configured on the server" },
      { status: 500 },
    );
  }

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin credentials are not configured" },
      { status: 500 },
    );
  }

  const ip = getRequestIp(req);
  const rl = await checkAdminLoginRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Try again later.",
        retryAfterSec: rl.retryAfterSec,
      },
      { status: 429 },
    );
  }

  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  if (!isValid) {
    await logActivity({
      req,
      action: "admin_login_failed",
      category: "admin",
      metadata: { username },
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionValue = await createAdminSessionCookieValue();
  if (!sessionValue) {
    return NextResponse.json(
      { error: "Could not create admin session" },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  await logActivity({
    req,
    action: "admin_login",
    category: "admin",
    metadata: { username },
  });

  return res;
}
