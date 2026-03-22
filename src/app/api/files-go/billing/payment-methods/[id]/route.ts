import { NextRequest, NextResponse } from "next/server";
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

// Set default payment method for invoices/subscriptions
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

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
  const paymentMethodId = id;

  try {
    const customerId = await findCustomerId(stripe, session.user.email!);
    if (!customerId) {
      return NextResponse.json(
        { error: "Stripe customer not found for this user." },
        { status: 404 }
      );
    }

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Stripe set default payment method error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to set default payment method." },
      { status: 500 }
    );
  }
}

// Remove a saved payment method from the customer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

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
  const paymentMethodId = id;

  try {
    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(paymentMethodId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Stripe delete payment method error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete payment method." },
      { status: 500 }
    );
  }
}

