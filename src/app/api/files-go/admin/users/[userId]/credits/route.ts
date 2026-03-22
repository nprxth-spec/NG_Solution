import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await request.json();
  const amount = typeof body.amount === "number" ? Math.floor(body.amount) : parseInt(String(body.amount), 10);
  if (!Number.isFinite(amount) || amount < 1 || amount > 99999) {
    return NextResponse.json({ error: "Invalid amount (1–99999)" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });

  return NextResponse.json({ credits: user.credits });
}
