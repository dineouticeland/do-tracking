# Migrating to do-tracking v2

Version 2 changes conversion semantics and delivery behavior. Upgrade the library and the consuming application together; do not treat this as a drop-in analytics-only version bump.

## 1. Upgrade and mount once

Install `@dineouticeland/do-tracking@^2.0.0` and keep one `DineoutTracking` component mounted near the application root.

The application does not choose one delivery mode for all restaurants:

```tsx
<DineoutTracking
  companyIdentifier={restaurantSlug}
  platform="dineout"
/>
```

Version 2 reads each restaurant's configured destination IDs and activates what is present:

- A configured GA4 ID receives direct GA4 events.
- A configured Meta Pixel ID receives direct Pixel events.
- A configured GTM ID receives data-layer events.
- A restaurant with both direct IDs and GTM receives both.

Do not add branching logic per restaurant. `companyTrackingMode` now defaults to `auto` and should normally be omitted. The explicit `direct`, `gtm`, and `both` values remain advanced overrides for exceptional integrations and diagnostics.

Audit restaurants whose GTM container forwards events to a GA4 property or Meta Pixel that is also configured directly. For those overlapping destinations, remove one delivery path or temporarily select the `gtm` override to avoid duplicates.

## 2. Change reservation conversion reporting

In v1, `Reservation Completed` was mapped to Purchase even when no money changed hands. In v2 it maps to GA4 `generate_lead` and Meta `Lead`.

Update completion payloads to include `restaurant_id`:

```tsx
trackDineout('Reservation Completed', {
  restaurant_id: 'rest-123',
  reservation_id: 'res-456',
  payment_required: false,
});
```

When a deposit is captured, emit an additional event from confirmed backend data:

```tsx
trackDineout('Reservation Deposit Paid', {
  restaurant_id: 'rest-123',
  reservation_id: 'res-456',
  payment_transaction_id: 'pay-789',
  value: 2000,
  currency: 'ISK',
});
```

Do not carry `amount_paid` on `Reservation Completed` as ecommerce revenue. The lead event represents the booking; the deposit event represents the payment. Existing Sinna booking semantics are unchanged.

Reservation funnel mappings also change from ecommerce-looking standard events to reservation-specific custom events:

- `Reservation Flow Started` → `reservation_flow_started`
- `Reservation Time Selected` → `reservation_time_selected`
- `Reservation Checkout Loaded` → `reservation_checkout_loaded`
- `Customer Details Submitted` → `reservation_customer_details_submitted`
- `Reservation Payment Started` → `reservation_payment_started`
- `Quick Book Clicked` → `quick_book_clicked`

Update GA4 explorations, audiences, ad conversions, Meta custom conversions, and GTM triggers that referenced the old event names.

## 3. Adopt the takeaway API

Replace generic `AddToCart`, `InitiateCheckout`, and `Purchase` calls with the typed `trackTakeaway` events. Use final line-item data from application state/backend receipts:

```tsx
trackTakeaway('Takeaway Order Completed', {
  restaurant_id: 'funkybhangra',
  order_id: '104582',
  cart_id: 'cart-4821',
  currency: 'ISK',
  fulfillment_type: 'pickup',
  value: 3290,
  items: [
    {
      item_id: 'burger-101',
      item_name: 'Funky Burger',
      price: 3290,
      quantity: 1,
      item_category: 'Burgers',
      item_variant: 'burger-101|patty:double|sauce:chili',
    },
  ],
});
```

Wire events to confirmed state transitions:

1. Menu render → `Takeaway Menu Viewed`.
2. Product selection/detail render → `Takeaway Item Selected` / `Takeaway Item Viewed`.
3. Successful cart reducer mutation → add/remove with only the quantity delta.
4. Cart open → `Takeaway Cart Viewed`.
5. Backend promo/gift-card response → applied/rejected.
6. Successful navigation to checkout → `Takeaway Checkout Started`.
7. Valid request handed to payment provider → `Takeaway Payment Submitted`.
8. Confirmed provider/API outcome → payment succeeded/failed.
9. Backend-accepted order from confirmation data → `Takeaway Order Completed`.

Do not fire add events while restoring a persisted cart. Do not fire Purchase from the Pay click. Use the backend order ID—not a confirmation-route GUID—for `order_id`.

## 4. Update SPA page views

GA4 and Meta automatic page views are disabled. Keep exactly one route-change hook and pass a full URL:

```tsx
trackPageView(window.location.href, document.title);
```

Remove any duplicate app-level `gtag('event', 'page_view', ...)` or `fbq('track', 'PageView')` calls owned by the old integration.

## 5. Update GTM variables and triggers

Takeaway ecommerce events now arrive as two data-layer pushes:

```js
dataLayer.push({ ecommerce: null });
dataLayer.push({ event: 'purchase', ecommerce: { /* GA4 ecommerce */ } });
```

Read item and order fields from `ecommerce`, not from arbitrary top-level payload keys. Add triggers for the new reservation-specific and takeaway custom event names. A configured GTM container receives these events automatically. If it forwards an event to a directly configured company GA4/Meta destination, remove that overlap or use the exceptional `companyTrackingMode="gtm"` override for that integration.

## 6. Account for conversion deduplication

Reservation leads, reservation deposit purchases, and takeaway purchases are deduplicated per stable event identity and destination using memory plus `sessionStorage`. This suppresses React re-renders and confirmation reloads. Ensure every real order/payment uses a stable, unique backend ID; do not generate a random ID in the browser.

## 7. Remove sensitive analytics fields

Audit existing calls and remove names, email addresses, phone numbers, addresses, card data, confirmation GUIDs, gift/clip-card codes, failed promo values, and raw provider errors. Use the exported normalized rejection reasons and payment failure codes (`declined`, `cancelled`, `timeout`, `provider_error`, or `unknown`).

## 8. Move off deprecated generic calls

`dineoutTrack` and `sendDineoutEvent` remain for compatibility and now route once through the unified dispatcher. They are deprecated. Prefer `trackTakeaway`, `trackDineout`, `trackDineoutDiscovery`, or `trackSinna` so payloads are typed and adapted correctly for each destination.

## Verification checklist

- Run `pnpm test` and `pnpm build` in this package.
- Use a unique test order and verify one purchase in GA4 DebugView and Meta Test Events.
- Verify the same confirmation render/reload does not create a second purchase.
- Verify an unpaid table reservation creates a Lead and no Purchase.
- Verify a paid reservation creates both one Lead and one deposit Purchase.
- In GTM Preview, confirm `{ ecommerce: null }` precedes each ecommerce event.
- Switch between two restaurant identifiers and confirm later events reach only the active restaurant.
- Confirm page views appear once per route change with the full `page_location`.
- Confirm no personal, card, gift-card, promo-attempt, or confirmation GUID data appears in any destination debugger.

Consent Mode and server-to-server delivery are not included in v2. The consuming app must set consent defaults before tracking initializes.
