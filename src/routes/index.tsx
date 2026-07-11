import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import logoAsset from "@/assets/elegantero-logo.png.asset.json";

const featuredQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: () => listProducts(8),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  component: Home,
  errorComponent: ({ error }) => <div className="p-8">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function Home() {
  const { data: products } = useSuspenseQuery(featuredQuery);
  return (
    <div>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Elegantero · Est. 2026</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05]">
              Elegance in <em className="italic">every</em> thread.
            </h1>
            <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
              Timeless menswear crafted with obsessive attention to fabric, cut, and finish. Made for those who know that details are everything.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/shop" className="inline-flex items-center justify-center border border-foreground bg-foreground text-background px-8 py-3 text-xs uppercase tracking-widest hover:bg-transparent hover:text-foreground transition">
                Shop the Collection
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={logoAsset.url} alt="Elegantero" className="max-w-full h-auto max-h-[420px]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">Featured</p>
            <h2 className="font-serif text-4xl">New arrivals</h2>
          </div>
          <Link to="/shop" className="text-xs uppercase tracking-widest hover:underline">View all →</Link>
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground">No products yet. Add some in your Shopify admin.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const price = product.priceRange.minVariantPrice;
  return (
    <Link to="/product/$handle" params={{ handle: product.handle }} className="group block">
      <div className="aspect-[3/4] bg-muted overflow-hidden mb-3">
        {product.featuredImage ? (
          <img src={product.featuredImage.url} alt={product.featuredImage.altText ?? product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
        ) : <div className="w-full h-full" />}
      </div>
      <h3 className="text-sm font-medium">{product.title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{formatPrice(price.amount, price.currencyCode)}</p>
    </Link>
  );
}
