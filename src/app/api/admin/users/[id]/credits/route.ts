import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyAdminSessionCookie } from "@/lib/admin-session";

async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const v = cookieStore.get("admin_session")?.value;
  return verifyAdminSessionCookie(v);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;
  const body = await req.json();
  const { amount, mode } = body as { amount: number; mode: "add" | "set" };

  if (typeof amount !== "number" || isNaN(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let newCredits: number;
    if (mode === "set") {
      newCredits = Math.max(0, amount);
    } else {
      newCredits = Math.max(0, user.credits + amount);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: newCredits },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        type: "admin_credit_adjust",
        description: `Admin adjusted credits: mode=${mode}, amount=${amount}, resulting=${newCredits}`,
      },
    });

    return NextResponse.json({ ok: true, credits: newCredits });
  } catch (err) {
    console.error("Credit adjust error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
