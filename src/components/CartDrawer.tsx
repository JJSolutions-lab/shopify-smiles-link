import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, setQuantity, totalAmount, currency } = useCartStore();
  const navigate = useNavigate();

  const goCheckout = () => {
    close();
    navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl">Your Bag</SheetTitle>
          <SheetDescription>
            {items.length === 0 ? "Your bag is empty." : `${items.length} item${items.length > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p>Nothing here yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.variantId} className="flex gap-3 border-b pb-4">
                  {i.image && <img src={i.image} alt={i.productTitle} className="w-20 h-20 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{i.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{i.selectedOptions.map((o) => o.value).join(" · ")}</p>
                    <p className="text-sm mt-1">{formatPrice(i.price.amount, i.price.currencyCode)}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(i.variantId, i.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQuantity(i.variantId, i.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => removeItem(i.variantId)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-lg font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(totalAmount(), currency())}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Button className="w-full h-12 text-base" onClick={goCheckout}>Checkout</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
