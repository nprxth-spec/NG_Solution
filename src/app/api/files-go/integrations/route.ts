import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getClientIp } from "@/lib/audit-log";

type SheetProfile = {
  id: string;
  name: string;
  sheetId: string;
  sheetName: string | null;
  sheetMapping: any | null;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      sheetId: true,
      sheetName: true,
      sheetMapping: true,
      sheetProfiles: true,
      activeSheetProfileId: true,
    },
  });

  // If user has existing simple config but no profiles yet, bootstrap a default profile.
  let profiles: SheetProfile[] = (user?.sheetProfiles as SheetProfile[] | null) ?? [];
  let activeId: string | null = (user?.activeSheetProfileId as string | null) ?? null;

  if (profiles.length === 0 && (user?.sheetId || user?.sheetName || user?.sheetMapping)) {
    const defaultId = "default";
    profiles = [
      {
        id: defaultId,
        name: "Default",
        sheetId: user?.sheetId ?? "",
        sheetName: user?.sheetName ?? null,
        sheetMapping: user?.sheetMapping ?? null,
      },
    ];
    activeId = defaultId;
  }

  return NextResponse.json({
    data: {
      profiles,
      activeProfileId: activeId,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const profiles = (body.profiles as SheetProfile[] | undefined) ?? [];
  const activeProfileId = (body.activeProfileId as string | undefined) ?? null;

  if (!Array.isArray(profiles)) {
    return NextResponse.json({ error: "Invalid profiles payload" }, { status: 400 });
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database. Please sign out and sign in again." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        sheetProfiles: profiles,
        activeSheetProfileId: activeProfile ? activeProfile.id : null,
        sheetId: activeProfile ? activeProfile.sheetId ?? null : null,
        sheetName: activeProfile ? activeProfile.sheetName ?? null : null,
        sheetMapping: activeProfile ? activeProfile.sheetMapping ?? null : null,
      },
    });
    await createAuditLog(
      session.user.id,
      "config_sheet",
      "แก้ไขการเชื่อมต่อ Google Sheet",
      { profileCount: profiles.length, activeId: activeProfile?.id ?? null },
      getClientIp(request)
    );

    revalidateTag(`user-sheet-${session.user.id}`, "max");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to save integrations:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to save integrations" },
      { status: 500 }
    );
  }
}
