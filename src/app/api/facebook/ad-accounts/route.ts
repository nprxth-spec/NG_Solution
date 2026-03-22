import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

const FB_API = "https://graph.facebook.com/v19.0";
const SYNC_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const isSync = searchParams.get("sync") === "true";
  const cacheKey = `fb_ad_accounts_${userId}`;

  // Check cache first if not syncing
  if (!isSync) {
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ accounts: cached, fromCache: true });
    }
  }

  // ── Server-side rate limiting (Only for sync=true, and only if user has ManagerAccount) ──
  if (isSync) {
    const existingAccountsCount = await prisma.managerAccount.count({
      where: { userId },
    });

    if (existingAccountsCount > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastFbAccountsSyncAt: true },
      });
      if (user?.lastFbAccountsSyncAt) {
        const elapsed = Date.now() - user.lastFbAccountsSyncAt.getTime();
        if (elapsed < SYNC_COOLDOWN_MS) {
          const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
          return NextResponse.json({ error: "rate_limited", secondsLeft }, { status: 429 });
        }
      }
    }
  }

  const fbTokens = await getAllFacebookTokens(userId);
  if (!fbTokens.length) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  try {
    const allResults = await Promise.all(
      fbTokens.map(async ({ providerAccountId, token }) => {
        try {
          const res = await fetch(
            `${FB_API}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name,spend_cap,amount_spent,business_country_code,is_personal,business{id,name},funding_source_details{display_string}&limit=500&access_token=${token}`
          );
          const data = await res.json();
          if (data.error) return [];
          return (data.data ?? []).map((acc: any) => {
            const display = acc.funding_source_details?.display_string ?? "";
            const paymentMethods: { brand: string; last4: string | null }[] = [];

            if (display) {
              const regex = /(Visa|Mastercard|MasterCard|American Express|Amex|JCB|Discover|Maestro|UnionPay)[^\d]*(\d{4})/gi;
              let m: RegExpExecArray | null;
              while ((m = regex.exec(display)) !== null) {
                paymentMethods.push({ brand: m[1], last4: m[2] });
              }

              if (!paymentMethods.length) {
                paymentMethods.push({ brand: display, last4: null });
              }
            }

            return {
              id: acc.id,
              accountId: acc.account_id,
              name: acc.name,
              status: acc.account_status,
              isActive: acc.account_status === 1,
              currency: acc.currency,
              timezone: acc.timezone_name,
              spendCap: acc.spend_cap ?? null,
              amountSpent: acc.amount_spent ?? null,
              paymentMethods,
              fbAccountId: providerAccountId,
              accountType: acc.is_personal ? "Personal" : (acc.business ? "Business" : "Other"),
              nationality: acc.business_country_code ?? null,
              businessName: acc.business?.name ?? null,
            };
          });
        } catch {
          return [];
        }
      })
    );

    // Combine and filter unique by accountId
    const seen = new Set<string>();
    const accounts = allResults.flat().filter((acc) => {
      if (seen.has(acc.accountId)) return false;
      seen.add(acc.accountId);
      return true;
    });

    // Save to cache
    await cacheSet(cacheKey, accounts, 300); // 5 minutes TTL

    if (isSync) {
      await prisma.user.update({ where: { id: userId }, data: { lastFbAccountsSyncAt: new Date() } });
    }

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("FB ad accounts error:", err);
    return NextResponse.json({ error: "Failed to fetch ad accounts" }, { status: 500 });
  }
}
