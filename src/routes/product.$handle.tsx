import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getProductByHandle, formatPrice } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

const productQuery = (handle: string) => queryOptions({
  queryKey: ["product", handle],
  queryFn: async () => {
    const p = await getProductByHandle(handle);
    if (!p) throw notFound();
    return p;
  },
});

export const Route = createFileRoute("/product/$handle")({
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.title} — Elegantero` },
      { name: "description", content: loaderData.description?.slice(0, 155) || "Elegantero" },
      { property: "og:title", content: `${loaderData.title} — Elegantero` },
      { property: "og:description", content: loaderData.description?.slice(0, 155) || "Elegantero" },
      ...(loaderData.featuredImage ? [{ property: "og:image", content: loaderData.featuredImage.url }] : []),
    ] : [{ title: "Product — Elegantero" }],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  component: ProductPage,
  errorComponent: ({ error }) => <div className="p-8">Failed to load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Product not found.</div>,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(handle));
  const [variantIndex, setVariantIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const variant = product.variants.edges[variantIndex]?.node;

  const add = () => {
    addItem(product, variantIndex, 1);
    toast.success(`Added to bag — ${product.title}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-2">
      <div className="space-y-4">
        {product.images.edges.length > 0 ? (
          product.images.edges.map((e, i) => (
            <img key={i} src={e.node.url} alt={e.node.altText ?? product.title} className="w-full aspect-[3/4] object-cover" />
          ))
        ) : (
          <div className="aspect-[3/4] bg-muted" />
        )}
      </div>
      <div className="md:sticky md:top-28 md:self-start">
        <h1 className="font-serif text-4xl md:text-5xl">{product.title}</h1>
        <p className="mt-3 text-xl">
          {variant && formatPrice(variant.price.amount, variant.price.currencyCode)}
        </p>
        {product.variants.edges.length > 1 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest mb-3">Options</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.edges.map((e, i) => (
                <button
                  key={e.node.id}
                  onClick={() => setVariantIndex(i)}
                  disabled={!e.node.availableForSale}
                  className={`px-4 py-2 text-xs uppercase tracking-widest border transition ${i === variantIndex ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"} disabled:opacity-40 disabled:line-through`}
                >
                  {e.node.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button onClick={add} disabled={!variant?.availableForSale} className="mt-8 w-full h-12 text-xs uppercase tracking-widest">
          {variant?.availableForSale ? "Add to bag" : "Sold out"}
        </Button>
        {product.descriptionHtml && (
          <div className="prose prose-sm mt-10 max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        )}
      </div>
    </div>
  );
}
