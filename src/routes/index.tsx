import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts, formatPrice, shopifyImg, shopifySrcSet, type ShopifyProduct } from "@/lib/shopify";
import { Heart } from "lucide-react";
import heroImg from "@/assets/hero-silk.jpg";
import essentials1 from "@/assets/essentials-1.jpg";
import essentials2 from "@/assets/essentials-2.jpg";

const featuredQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: () => listProducts(8),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  component: Home,
  head: () => ({
    meta: [
      { title: "Elegantero — Elegance in Every Thread" },
      { name: "description", content: "Discover Elegantero — timeless, artisan-crafted essentials designed in Paris, made in Italy." },
    ],
    links: [
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function Home() {
  const { data: products } = useSuspenseQuery(featuredQuery);
  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <img
          src={heroImg}
          alt="Elegantero summer in silk"
          width={1920}
          height={1200}
          className="w-full h-[70vh] md:h-[85vh] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-16 left-6 md:left-16 max-w-lg text-white">
          <h1 className="font-serif italic text-5xl md:text-7xl leading-[1.05]">A summer in silk</h1>
          <p className="mt-5 text-sm md:text-base opacity-90 max-w-md">
            The season unfolds in flowing silhouettes, sun-warmed cottons and pieces made to be lived in.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-block text-xs uppercase tracking-[0.3em] border-b border-white pb-1 hover:opacity-80 transition"
          >
            Discover the collection
          </Link>
        </div>
      </section>

      {/* Essentials */}
      <section className="py-20">
        <h2 className="font-serif italic text-4xl md:text-5xl text-center mb-12">The essentials</h2>
        <div className="grid md:grid-cols-2 gap-1">
          <Link to="/shop" className="relative group overflow-hidden">
            <img src={essentials1} alt="Silk scarves" width={1200} height={1500} loading="lazy" className="w-full h-[70vh] object-cover group-hover:scale-[1.02] transition duration-700" />
            <span className="absolute bottom-8 left-8 text-white text-xs uppercase tracking-[0.3em] border-b border-white pb-1">Silks & scarves</span>
          </Link>
          <Link to="/shop" className="relative group overflow-hidden">
            <img src={essentials2} alt="Knitwear" width={1200} height={1500} loading="lazy" className="w-full h-[70vh] object-cover group-hover:scale-[1.02] transition duration-700" />
            <span className="absolute bottom-8 left-8 text-white text-xs uppercase tracking-[0.3em] border-b border-white pb-1">Knitwear</span>
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3">New arrivals</p>
          <h2 className="font-serif italic text-4xl md:text-5xl">This season's edit</h2>
        </div>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground">No products yet. Add some in your Shopify admin.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Story */}
      <section className="bg-muted/50 py-24">
        <div className="mx-auto max-w-2xl text-center px-4">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-5">Elegantero story</p>
          <blockquote className="font-serif italic text-4xl md:text-5xl leading-tight">
            "Craft, refined by time."
          </blockquote>
          <p className="mt-8 text-muted-foreground leading-relaxed">
            Every piece is designed in Paris and made in Italy by artisans who have spent decades
            perfecting a single stitch. We believe in fewer, better things — pieces you will keep, wear and pass on.
          </p>
        </div>
      </section>
    </div>
  );
}

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const price = product.priceRange.minVariantPrice;
  return (
    <div className="group relative">
      <Link to="/product/$handle" params={{ handle: product.handle }} className="block">
        <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-4">
          {product.featuredImage ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
          ) : <div className="w-full h-full" />}
        </div>
        <h3 className="font-serif italic text-lg text-center">{product.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      </Link>
      <button
        type="button"
        aria-label="Add to wishlist"
        className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur border border-border hover:bg-background transition"
      >
        <Heart className="w-4 h-4" />
      </button>
    </div>
  );
}
