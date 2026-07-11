import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/elegantero-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, Heart, Search } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { toggle, totalItems } = useCartStore();
  const { user } = useAuth();
  const count = totalItems();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 grid grid-cols-3 items-center h-14 sm:h-20">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" aria-label="Search" className="h-9 w-9 sm:h-10 sm:w-10">
            <Search className="w-5 h-5" />
          </Button>
        </div>
        <Link to="/" className="flex items-center justify-center min-w-0" aria-label="Elegantero home">
          <img
            src={logoAsset.url}
            alt="Elegantero — Elegance in Every Thread"
            width={220}
            height={64}
            fetchPriority="high"
            decoding="async"
            className="h-10 sm:h-14 md:h-16 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <Button variant="ghost" size="icon" aria-label="Wishlist" className="hidden sm:inline-flex">
            <Heart className="w-5 h-5" />
          </Button>
          <Link to={user ? "/account/orders" : "/auth"} className="flex items-center gap-2 px-2 h-10 text-xs uppercase tracking-widest text-foreground/80 hover:text-foreground transition">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{user ? "Account" : "Sign in"}</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Open cart" className="relative h-9 w-9 sm:h-10 sm:w-10">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-foreground text-background text-[10px] font-medium rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>
      <nav className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-6 sm:gap-12 h-10 sm:h-12 text-[11px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em]">
          <Link to="/shop" activeProps={{ className: "text-foreground" }} className="text-foreground/80 hover:text-foreground transition">Shop</Link>
          <a href="/shop?category=women" className="text-foreground/80 hover:text-foreground transition">Women</a>
          <a href="/shop?category=men" className="text-foreground/80 hover:text-foreground transition">Men</a>
        </div>
      </nav>
    </header>
  );
}

const footerCols = [
  {
    title: "Services",
    links: [
      { label: "Contact us", to: "/" },
      { label: "FAQ", to: "/" },
      { label: "Find a store", to: "/" },
      { label: "Gifting", to: "/" },
    ],
  },
  {
    title: "Orders",
    links: [
      { label: "Payment", to: "/" },
      { label: "Shipping", to: "/" },
      { label: "Track orders", to: "/account/orders" },
      { label: "Returns", to: "/" },
    ],
  },
  {
    title: "Elegantero",
    links: [
      { label: "Sustainability", to: "/" },
      { label: "Our story", to: "/" },
      { label: "Careers", to: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & conditions", to: "/" },
      { label: "Privacy & cookies", to: "/" },
      { label: "Accessibility", to: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {footerCols.map((col) => (
          <div key={col.title}>
            <p className="font-serif italic text-sm text-foreground/70 mb-5">{col.title}</p>
            <ul className="space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-foreground/80 hover:text-foreground transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4">Newsletter</p>
          <p className="text-sm text-muted-foreground">
            Receive our newsletter and discover our stories, collections and surprises.
          </p>
          <form
            className="mt-6 flex items-center border-b border-foreground/60"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Your email"
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="text-xs uppercase tracking-[0.3em] px-3 py-3 hover:opacity-70 transition">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground py-6 border-t border-border/60">
        © {new Date().getFullYear()} Elegantero. All rights reserved.
      </div>
    </footer>
  );
}
