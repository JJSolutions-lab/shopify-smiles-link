# Elegantero storefront build plan

## 1. Brand
- Upload the Elegantero panther logo to Lovable Assets and use it in the header, footer, and favicon.
- Set `<title>` = "Elegantero — Elegance in Every Thread" and matching meta / OG tags on `__root.tsx`.
- Design system: ivory background, deep black, thin serif (Cormorant / Libre Caslon) for headings, clean sans (Inter) for body — matches the logo's editorial feel.

## 2. Storefront (Shopify Storefront API)
- New routes: `/` (hero + featured), `/shop` (grid), `/product/$handle` (PDP), `/cart`, `/checkout`, `/account/orders`.
- Pull real products from your connected store `style-haven-8rwub.myshopify.com` via Storefront API.
- Zustand cart store (persisted). Cart drawer in header.

## 3. Backend (Lovable Cloud)
Enable Cloud for:
- **Auth**: email/password sign-in so customers can view their order history.
- **`orders` table** (customer_id, shopify_line_items JSON, total, currency, status, stripe_payment_intent_id, shipping_address, created_at) with RLS: users read their own orders only.

## 4. Custom Stripe checkout (in-app)
- Enable Lovable's built-in Stripe payments (no external account needed for test mode).
- `/checkout` page collects email + shipping + Stripe Payment Element.
- Server function creates a Stripe PaymentIntent for the cart total.
- On success: write an `orders` row, clear the cart, redirect to `/account/orders`.
- Note: Afterpay is a Stripe payment method — I'll enable it on the PaymentIntent (`payment_method_types: ['card','afterpay_clearpay']`). It's only available in test mode until you claim the Stripe account and enable Afterpay live.

## 5. Order History
- `/account/orders` (auth-gated) lists the signed-in user's orders with items, total, status, and date.

## Trade-offs you should know
- **Custom Stripe checkout bypasses Shopify's checkout**, so orders won't appear in your Shopify admin automatically — they live in the Lovable Cloud `orders` table. If you'd rather have orders show in Shopify, we should switch to Shopify's hosted checkout (Stripe + Afterpay enable there natively). Say the word and I'll swap approach.
- Inventory won't decrement in Shopify with the custom flow. Fine for MVP, not for real stock control.

## Order of execution (multiple turns)
1. Assets + rebrand + Cloud + Stripe enable + Shopify Storefront API wiring.
2. Home, Shop, PDP, Cart.
3. Auth + orders schema + Stripe PaymentIntent + checkout page.
4. Order history page + polish.

Approve and I'll start with step 1.
