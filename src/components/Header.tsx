import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { toggle, totalItems } = useCartStore();
  const { user } = useAuth();
  const count = totalItems();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Logo className="h-12 w-auto" />
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-wider uppercase">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="text-muted-foreground hover:text-foreground transition">Home</Link>
          <Link to="/shop" activeProps={{ className: "text-foreground" }} className="text-muted-foreground hover:text-foreground transition">Shop</Link>
          {user && (
            <Link to="/account/orders" activeProps={{ className: "text-foreground" }} className="text-muted-foreground hover:text-foreground transition">Orders</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to={user ? "/account/orders" : "/auth"}>
            <Button variant="ghost" size="icon" aria-label={user ? "Account" : "Sign in"}>
              <User className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Open cart" className="relative">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-3 items-start">
        <div>
          <Logo className="h-10 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground italic font-serif">Elegance in Every Thread.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="uppercase tracking-wider text-xs text-foreground mb-3">Shop</p>
          <ul className="space-y-2">
            <li><Link to="/shop">All Products</Link></li>
            <li><Link to="/">New Arrivals</Link></li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="uppercase tracking-wider text-xs text-foreground mb-3">Account</p>
          <ul className="space-y-2">
            <li><Link to="/auth">Sign in</Link></li>
            <li><Link to="/account/orders">Order history</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-6 border-t border-border/60">
        © {new Date().getFullYear()} Elegantero. All rights reserved.
      </div>
    </footer>
  );
}
