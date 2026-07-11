import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/shopify";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({ meta: [{ title: "Order history — Elegantero" }] }),
  component: OrdersPage,
});

interface OrderRow {
  id: string;
  status: string;
  amount_total: number;
  currency: string;
  email: string;
  items: Array<{ productTitle: string; variantTitle: string; quantity: number; image: string | null; price: { amount: string; currencyCode: string } }>;
  payment_method: string | null;
  created_at: string;
}

function OrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as OrderRow[]) ?? [];
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Account</p>
          <h1 className="font-serif text-4xl">Order history</h1>
        </div>
        <Button variant="outline" onClick={signOut} className="text-xs uppercase tracking-widest">Sign out</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">Failed to load orders.</p>}
      {data && data.length === 0 && (
        <div className="text-center border border-dashed border-border py-20">
          <p className="text-muted-foreground mb-4">No orders yet.</p>
          <Link to="/shop" className="inline-flex items-center justify-center border border-foreground bg-foreground text-background px-6 py-3 text-xs uppercase tracking-widest hover:bg-transparent hover:text-foreground transition">Start shopping</Link>
        </div>
      )}
      {data && data.length > 0 && (
        <ul className="space-y-6">
          {data.map((o) => (
            <li key={o.id} className="border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Order</p>
                  <p className="font-mono text-sm">{o.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Payment</p>
                  <p className="text-sm capitalize">{(o.payment_method ?? "card").replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                  <p className="text-sm capitalize">{o.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
                  <p className="text-sm font-medium">{formatPrice(o.amount_total / 100, o.currency.toUpperCase())}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {o.items.map((it, i) => (
                  <li key={i} className="flex gap-3 items-center">
                    {it.image && <img src={it.image} alt={it.productTitle} className="w-14 h-14 object-cover" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{it.productTitle}</p>
                      <p className="text-xs text-muted-foreground">{it.variantTitle} · qty {it.quantity}</p>
                    </div>
                    <p className="text-sm">{formatPrice(parseFloat(it.price.amount) * it.quantity, it.price.currencyCode)}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
