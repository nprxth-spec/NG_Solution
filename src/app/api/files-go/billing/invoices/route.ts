import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

async function findCustomerId(stripe: Stripe, email: string) {
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });
  return existing.data[0]?.id ?? null;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const customerId = await findCustomerId(stripe, session.user.email!);
    if (!customerId) {
      return NextResponse.json({ data: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    const data = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      hosted_invoice_url: inv.hosted_invoice_url,
      created: inv.created ? inv.created * 1000 : null,
      period_start: inv.lines.data[0]?.period?.start
        ? inv.lines.data[0].period.start * 1000
        : null,
      period_end: inv.lines.data[0]?.period?.end
        ? inv.lines.data[0].period.end * 1000
        : null,
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Stripe invoices error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch invoices." },
      { status: 500 }
    );
  }
}

