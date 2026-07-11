import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/shopify";
import { ProductCard } from "./index";

const shopQuery = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => listProducts(48),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Elegantero" },
      { name: "description", content: "Browse the complete Elegantero collection of shirts and menswear." },
      { property: "og:title", content: "Shop — Elegantero" },
      { property: "og:description", content: "Browse the complete Elegantero collection." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQuery),
  component: Shop,
  errorComponent: ({ error }) => <div className="p-8">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function Shop() {
  const { data: products } = useSuspenseQuery(shopQuery);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="mb-8 md:mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">The Collection</p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl">Shop All</h1>
      </div>
      {products.length === 0 ? (
        <p className="text-muted-foreground">No products yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
