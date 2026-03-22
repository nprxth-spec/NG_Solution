import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE all processing logs for a given user.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const result = await prisma.processingLog.deleteMany({
      where: { userId },
    });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err: any) {
    console.error("Admin delete logs error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete logs" },
      { status: 500 }
    );
  }
}

