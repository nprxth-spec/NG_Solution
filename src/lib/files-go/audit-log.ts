import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
 * Pass ip when available (e.g. from getClientIp(request) in API routes).
 */
export async function createAuditLog(
  userId: string,
  type: AuditLogType,
  description?: string | null,
  metadata?: Record<string, unknown> | null,
  ip?: string | null
): Promise<void> {
  try {
    const mergedMetadata =
      ip != null
        ? { ...(metadata ?? {}), ip }
        : (metadata ?? undefined);
    await prisma.auditLog.create({
      data: {
        userId,
        type,
        description: description ?? null,
        metadata:
          mergedMetadata != null
            ? (mergedMetadata as Prisma.InputJsonValue)
            : undefined,
      },
    });
  } catch (err) {
    console.error("Audit log create failed:", err);
  }
}
