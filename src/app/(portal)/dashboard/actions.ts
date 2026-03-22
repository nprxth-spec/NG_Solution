"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getRecentLogins() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const logs = await prisma.userActivityLog.findMany({
    where: { userId: session.user.id, action: "login" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      ip: true,
      userAgent: true,
      metadata: true,
    }
  });

  return logs;
}

export async function updateProfile(data: { name: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!data.name || data.name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters long.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name.trim() }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Cascading deletes in Prisma schema will handle related records
  await prisma.user.delete({
    where: { id: session.user.id }
  });

  return { success: true };
}

export async function getUserPasswordStatus() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  })) as any;

  return { hasPassword: !!user?.password };
}

import bcrypt from "bcryptjs";

export async function setUserPassword(password: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  })) as any;

  if (user?.password) {
    throw new Error("Password already set. Use change password instead.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function changeUserPassword(data: { current: string; new: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  })) as any;

  if (!user?.password) {
    throw new Error("No password set. Use set password instead.");
  }

  const isMatch = await bcrypt.compare(data.current, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect.");
  }

  if (data.new.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const hashedPassword = await bcrypt.hash(data.new, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  });

  return { success: true };
}
