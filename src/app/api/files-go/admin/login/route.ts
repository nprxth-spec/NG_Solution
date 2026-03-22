import { NextResponse } from "next/server";
import { createAdminToken, setAdminCookie, checkAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = createAdminToken();
  await setAdminCookie(token);
  return NextResponse.json({ ok: true });
}
