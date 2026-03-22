import { prisma } from "@/lib/db";

export type AuditLogType =
  | "login"
  | "config_drive"
  | "config_sheet"
  | "config_naming"
  | "config_plan";

/**
 * Get client IP from request (handles proxies: x-forwarded-for, x-real-ip).
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

/**
 * Create an audit log entry (login, config changes). Fire-and-forget safe.
 * This implementation maps to UserActivityLog model in the portal.
 */
export async function createAuditLog(
  userId: string,
  type: AuditLogType,
  description?: string | null,
  metadata?: Record<string, unknown> | null,
  ip?: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        type,
        description: description ?? null,
        metadata: metadata as any,
        ip: ip ?? null,
      },
    });
  } catch (err) {
    console.error("Audit log create failed:", err);
  }
}
