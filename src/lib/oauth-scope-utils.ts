/**
 * Required OAuth scopes — keep in sync with:
 * - Google: `src/lib/auth.ts` (Google provider authorization.params.scope)
 * - Facebook: `src/app/api/auth/link-facebook/route.ts` + callback create()
 */
export const REQUIRED_GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
] as const;

export const REQUIRED_FACEBOOK_SCOPES = [
  "email",
  "public_profile",
  "ads_read",
  "ads_management",
  "business_management",
  "read_insights",
  "pages_messaging",
  "pages_manage_metadata",
  "pages_read_engagement",
] as const;

export type ScopeCheckResult = {
  linked: boolean;
  /** Raw scope string from DB (if any) */
  rawScope: string | null;
  missing: string[];
  grantedCount: number;
  requiredCount: number;
  complete: boolean;
  /** มี Account แต่ไม่มี scope ใน DB — ตรวจรายการไม่ได้ */
  scopeUnknown: boolean;
};

function parseGoogleScopes(raw: string | null | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Google คืน scope ได้หลายรูปแบบที่เทียบเท่ากัน — ต้องไม่ถือว่าขาดถ้าได้รูปแบบ URL
 * (เช่น ขอ `email` แต่ token มี `.../userinfo.email`)
 * @see https://developers.google.com/identity/protocols/oauth2/scopes
 */
const GOOGLE_SCOPE_EQUIVALENTS: Record<string, readonly string[]> = {
  email: [
    "email",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  profile: [
    "profile",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

function isGoogleScopeGranted(
  granted: Set<string>,
  required: string,
): boolean {
  if (granted.has(required)) return true;
  const equivalents = GOOGLE_SCOPE_EQUIVALENTS[required];
  if (equivalents) {
    return equivalents.some((s) => granted.has(s));
  }
  return false;
}

function parseFacebookScopes(raw: string | null | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function checkGoogleScopes(
  scopeFromDb: string | null | undefined,
  hasAccount: boolean,
): ScopeCheckResult {
  const required = [...REQUIRED_GOOGLE_SCOPES];
  if (!hasAccount) {
    return {
      linked: false,
      rawScope: scopeFromDb ?? null,
      missing: [],
      grantedCount: 0,
      requiredCount: required.length,
      complete: false,
      scopeUnknown: false,
    };
  }
  const granted = parseGoogleScopes(scopeFromDb);
  const scopeUnknown = !scopeFromDb?.trim();
  const missing = scopeUnknown
    ? required
    : required.filter((s) => !isGoogleScopeGranted(granted, s));
  return {
    linked: true,
    rawScope: scopeFromDb ?? null,
    missing,
    grantedCount: scopeUnknown ? 0 : required.length - missing.length,
    requiredCount: required.length,
    complete: !scopeUnknown && missing.length === 0,
    scopeUnknown,
  };
}

export function checkFacebookScopes(
  scopeFromDb: string | null | undefined,
  hasAccount: boolean,
): ScopeCheckResult {
  const required = [...REQUIRED_FACEBOOK_SCOPES];
  if (!hasAccount) {
    return {
      linked: false,
      rawScope: scopeFromDb ?? null,
      missing: [],
      grantedCount: 0,
      requiredCount: required.length,
      complete: false,
      scopeUnknown: false,
    };
  }
  const granted = parseFacebookScopes(scopeFromDb);
  const scopeUnknown = !scopeFromDb?.trim();
  const missing = scopeUnknown
    ? required
    : required.filter((s) => !granted.has(s));
  return {
    linked: true,
    rawScope: scopeFromDb ?? null,
    missing,
    grantedCount: scopeUnknown ? 0 : required.length - missing.length,
    requiredCount: required.length,
    complete: !scopeUnknown && missing.length === 0,
    scopeUnknown,
  };
}
