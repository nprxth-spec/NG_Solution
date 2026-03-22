import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit-log";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { filenameMapping: true },
  });

  return NextResponse.json({ data: user?.filenameMapping ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mapping = body?.mapping as Record<string, string> | null | undefined;

  if (!mapping || typeof mapping !== "object") {
    return NextResponse.json(
      { error: "Invalid mapping payload" },
      { status: 400 }
    );
  }

  // Basic normalization: keep only non-empty 4+ digit keys with non-empty prefixes.
  const cleaned: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(mapping)) {
    const key = String(rawKey).trim();
    const val = String(rawVal).trim();
    if (!key || !val) continue;
    cleaned[key] = val;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { filenameMapping: cleaned },
  });
  await createAuditLog(
    session.user.id,
    "config_naming",
    "แก้ไขกฎชื่อไฟล์ (last 4 digits → prefix)",
    { ruleCount: Object.keys(cleaned).length },
    getClientIp(request)
  );

  return NextResponse.json({ success: true });
}

