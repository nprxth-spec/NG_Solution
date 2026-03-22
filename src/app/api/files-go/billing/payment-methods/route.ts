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

    const [methods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      }),
      stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      }),
    ]);

    let defaultPaymentMethodId: string | null = null;
    const invoiceSettings: any = (customer as any).invoice_settings;
    if (invoiceSettings?.default_payment_method) {
      const def = invoiceSettings.default_payment_method;
      defaultPaymentMethodId =
        typeof def === "string" ? def : (def.id as string | null);
    }

    const data = methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
      is_default: pm.id === defaultPaymentMethodId,
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Stripe payment methods error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch payment methods." },
      { status: 500 }
    );
  }
}

