import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getStripePublishableKey = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) throw new Error("STRIPE_PUBLISHABLE_KEY is not configured");
  return { publishableKey: key };
});

interface CartLine {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: { amount: string; currencyCode: string };
  image: string | null;
  productHandle: string;
}

export const createPaymentIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { items: CartLine[]; email: string }) => {
    if (!Array.isArray(input?.items) || input.items.length === 0) throw new Error("Cart is empty");
    if (!input.email || !/.+@.+\..+/.test(input.email)) throw new Error("Valid email required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const currency = (data.items[0]?.price.currencyCode ?? "USD").toLowerCase();
    const amount = Math.round(
      data.items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0) * 100,
    );
    if (amount < 50) throw new Error("Order total too low");

    const pmTypes = currency === "usd" || currency === "cad" || currency === "aud" || currency === "gbp"
      ? ["card", "afterpay_clearpay"]
      : ["card"];

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: data.email,
      payment_method_types: pmTypes,
      metadata: {
        user_id: context.userId,
        item_count: String(data.items.reduce((s, i) => s + i.quantity, 0)),
      },
    });

    return { clientSecret: intent.client_secret!, paymentIntentId: intent.id, amount, currency };
  });

interface RecordOrderInput {
  paymentIntentId: string;
  items: CartLine[];
  email: string;
  shippingName?: string;
  shippingAddress?: Record<string, unknown>;
}

export const recordOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RecordOrderInput) => {
    if (!input?.paymentIntentId) throw new Error("Missing paymentIntentId");
    if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("No items");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
    if (intent.status !== "succeeded" && intent.status !== "processing") {
      throw new Error(`Payment not completed (status: ${intent.status})`);
    }
    if (intent.metadata?.user_id && intent.metadata.user_id !== context.userId) {
      throw new Error("Payment intent user mismatch");
    }

    const { error, data: row } = await context.supabase
      .from("orders")
      .upsert(
        {
          user_id: context.userId,
          stripe_payment_intent_id: intent.id,
          status: intent.status,
          amount_total: intent.amount,
          currency: intent.currency,
          email: data.email,
          shipping_name: data.shippingName ?? null,
          shipping_address: (data.shippingAddress ?? null) as never,
          items: data.items as never,
          payment_method: intent.payment_method_types?.[0] ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_payment_intent_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { orderId: row.id };
  });
