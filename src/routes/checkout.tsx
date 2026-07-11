import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { createPaymentIntent, getStripePublishableKey, recordOrder } from "@/lib/stripe.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Elegantero" }] }),
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { next: location.href } });
  },
  component: CheckoutPage,
});

let stripePromise: Promise<StripeJs | null> | null = null;
const getStripePromise = async (getKey: () => Promise<{ publishableKey: string }>) => {
  if (!stripePromise) {
    const { publishableKey } = await getKey();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const currency = useCartStore((s) => s.currency);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState({ line1: "", city: "", region: "", postal: "", country: "" });
  const [stripe, setStripe] = useState<StripeJs | null>(null);
  const [creating, setCreating] = useState(false);

  const getKey = useServerFn(getStripePublishableKey);
  const createPI = useServerFn(createPaymentIntent);

  useEffect(() => {
    getStripePromise(() => getKey()).then((s) => setStripe(s));
  }, [getKey]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const startPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Your cart is empty.");
    setCreating(true);
    try {
      const res = await createPI({ data: { items, email } });
      setClientSecret(res.clientSecret);
      setPaymentIntentId(res.paymentIntentId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start payment");
    } finally {
      setCreating(false);
    }
  };

  if (items.length === 0 && !clientSecret) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Your bag is empty</h1>
        <p className="text-muted-foreground mb-6">Add something to check out.</p>
        <Link to="/shop" className="inline-flex items-center justify-center border border-foreground bg-foreground text-background px-6 py-3 text-xs uppercase tracking-widest">Shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 grid gap-12 md:grid-cols-2">
      <div>
        <h1 className="font-serif text-4xl mb-8">Checkout</h1>

        {!clientSecret && (
          <form onSubmit={startPayment} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Full name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Address</Label>
              <Input required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
              <Input required value={address.region} onChange={(e) => setAddress({ ...address, region: e.target.value })} placeholder="State/Region" />
              <Input required value={address.postal} onChange={(e) => setAddress({ ...address, postal: e.target.value })} placeholder="Postal code" />
              <Input required value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} placeholder="Country" />
            </div>
            <Button type="submit" disabled={creating} className="w-full h-12 text-xs uppercase tracking-widest">
              {creating ? "Preparing…" : "Continue to payment"}
            </Button>
          </form>
        )}

        {clientSecret && stripe && paymentIntentId && (
          <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: "flat" } }}>
            <PayForm email={email} name={name} address={address} paymentIntentId={paymentIntentId} />
          </Elements>
        )}
      </div>

      <aside className="md:sticky md:top-28 md:self-start border border-border p-6 bg-card">
        <h2 className="font-serif text-2xl mb-4">Order summary</h2>
        <ul className="space-y-3 divide-y divide-border/60">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3 pt-3 first:pt-0">
              {i.image && <img src={i.image} alt={i.productTitle} className="w-14 h-14 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{i.productTitle}</p>
                <p className="text-xs text-muted-foreground">{i.selectedOptions.map((o) => o.value).join(" · ")} · qty {i.quantity}</p>
              </div>
              <p className="text-sm">{formatPrice(parseFloat(i.price.amount) * i.quantity, i.price.currencyCode)}</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-border mt-4 pt-4 flex justify-between text-lg font-medium">
          <span>Total</span>
          <span>{formatPrice(totalAmount(), currency())}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Includes Afterpay / Clearpay when eligible.</p>
      </aside>
    </div>
  );
}

function PayForm({ email, name, address, paymentIntentId }: { email: string; name: string; address: Record<string, string>; paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const record = useServerFn(recordOrder);

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/account/orders",
        payment_method_data: { billing_details: { email, name, address: { line1: address.line1, city: address.city, state: address.region, postal_code: address.postal, country: address.country } } },
      },
      redirect: "if_required",
    });
    if (error) {
      setSubmitting(false);
      return toast.error(error.message || "Payment failed");
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      try {
        await record({ data: { paymentIntentId, items, email, shippingName: name, shippingAddress: address } });
        clear();
        toast.success("Order confirmed.");
        navigate({ to: "/account/orders" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save order");
      }
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={pay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <Button type="submit" disabled={!stripe || submitting} className="w-full h-12 text-xs uppercase tracking-widest">
        {submitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}
