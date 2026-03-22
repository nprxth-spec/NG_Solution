import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

async function getOrCreateCustomer(stripe: Stripe, email: string, userId: string) {
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const created = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  return created.id;
}

export async function POST(request: Request) {
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
    const customerId = await getOrCreateCustomer(
      stripe,
      session.user.email!,
      session.user.id
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err: any) {
    console.error("Stripe setup intent error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to create SetupIntent." },
      { status: 500 }
    );
  }
}

