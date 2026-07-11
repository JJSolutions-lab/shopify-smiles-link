import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { createShopifyCheckout, formatPrice } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Elegantero" }] }),
  ssr: false,
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const totalAmount = useCartStore((s) => s.totalAmount);
  const currency = useCartStore((s) => s.currency);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-redirect to Shopify's hosted checkout as soon as we have items
    if (items.length === 0 || loading) return;
    let cancelled = false;
    setLoading(true);
    createShopifyCheckout(items.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity })))
      .then((url) => {
        if (cancelled) return;
        window.location.href = url;
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Could not start checkout");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Your bag is empty</h1>
        <p className="text-muted-foreground mb-6">Add something to check out.</p>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center border border-foreground bg-foreground text-background px-6 py-3 text-xs uppercase tracking-widest"
        >
          Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-4xl mb-4">Redirecting to secure checkout…</h1>
      <p className="text-muted-foreground mb-8">
        You are being taken to Shopify's secure checkout to complete your order of{" "}
        <span className="font-medium text-foreground">{formatPrice(totalAmount(), currency())}</span>.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Test gateway: use card number <span className="font-mono">1</span> to simulate an approved payment,
        <span className="font-mono"> 2</span> for declined, <span className="font-mono">3</span> for failure.
        Any 3-digit CVC and any future expiry work.
      </p>
      <Button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const url = await createShopifyCheckout(
              items.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity })),
            );
            window.location.href = url;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not start checkout");
            setLoading(false);
          }
        }}
        className="h-12 px-8 text-xs uppercase tracking-widest"
      >
        {loading ? "Opening checkout…" : "Continue to Shopify checkout"}
      </Button>
    </div>
  );
}
