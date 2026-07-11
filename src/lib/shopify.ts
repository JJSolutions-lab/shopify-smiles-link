// Shopify Storefront API client + product/cart queries
const SHOP_DOMAIN = "style-haven-8rwub.myshopify.com";
const STOREFRONT_TOKEN = "23fde92e8ab8f7fcc37c64738a0b3863";
const API_VERSION = "2025-07";
const ENDPOINT = `https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json`;

export interface ShopifyImage {
  url: string;
  altText: string | null;
}
export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}
export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  selectedOptions: Array<{ name: string; value: string }>;
}
export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ShopifyImage | null;
  images: { edges: Array<{ node: ShopifyImage }> };
  priceRange: { minVariantPrice: ShopifyMoney };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  options: Array<{ id: string; name: string; values: string[] }>;
}

export async function storefrontRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${await res.text()}`);
  return res.json();
}

const PRODUCT_FRAGMENT = `
  id handle title description descriptionHtml
  featuredImage { url altText }
  images(first: 6) { edges { node { url altText } } }
  priceRange { minVariantPrice { amount currencyCode } }
  options { id name values }
  variants(first: 50) {
    edges { node {
      id title availableForSale
      price { amount currencyCode }
      selectedOptions { name value }
    } }
  }
`;

export async function listProducts(limit = 24): Promise<ShopifyProduct[]> {
  const query = `query Products($n:Int!){ products(first:$n){ edges { node { ${PRODUCT_FRAGMENT} } } } }`;
  const { data, errors } = await storefrontRequest<{ products: { edges: Array<{ node: ShopifyProduct }> } }>(query, { n: limit });
  if (errors?.length) throw new Error(errors[0].message);
  return data?.products.edges.map((e) => e.node) ?? [];
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `query P($h:String!){ product(handle:$h){ ${PRODUCT_FRAGMENT} } }`;
  const { data, errors } = await storefrontRequest<{ product: ShopifyProduct | null }>(query, { h: handle });
  if (errors?.length) throw new Error(errors[0].message);
  return data?.product ?? null;
}

export function formatPrice(amount: string | number, currencyCode = "USD") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(n);
}

/** Shopify CDN transform: add width param for responsive sizing. */
export function shopifyImg(url: string | undefined | null, width: number): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(width));
    return u.toString();
  } catch {
    return url;
  }
}

/** Build a srcset for common widths from a Shopify CDN URL. */
export function shopifySrcSet(url: string | undefined | null, widths: number[]): string {
  if (!url) return "";
  return widths.map((w) => `${shopifyImg(url, w)} ${w}w`).join(", ");
}

export async function createShopifyCheckout(
  lines: Array<{ merchandiseId: string; quantity: number }>,
  email?: string,
): Promise<string> {
  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `;
  const input: Record<string, unknown> = { lines };
  if (email) input.buyerIdentity = { email };
  const { data, errors } = await storefrontRequest<{
    cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: Array<{ message: string }> };
  }>(mutation, { input });
  if (errors?.length) throw new Error(errors[0].message);
  const ue = data?.cartCreate.userErrors;
  if (ue?.length) throw new Error(ue[0].message);
  const url = data?.cartCreate.cart?.checkoutUrl;
  if (!url) throw new Error("Could not create checkout");
  try {
    const u = new URL(url);
    u.searchParams.set("channel", "online_store");
    return u.toString();
  } catch {
    return url;
  }
}
