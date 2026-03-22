import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // This will cascade-delete accounts, sessions, logs, etc. per Prisma schema
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete account:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete account" },
      { status: 500 }
    );
  }
}

