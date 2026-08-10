# Dineout Tracking

`@dineouticeland/do-tracking` loads Dineout and restaurant analytics destinations and provides typed tracking APIs for takeaway ecommerce, table reservations, Dineout discovery, and Sinna bookings.

Version 2 adds a GA4/Meta-compatible takeaway ecommerce contract and treats a confirmed table reservation as a lead. A paid reservation deposit is tracked separately as a purchase.

## Install

```bash
pnpm add @dineouticeland/do-tracking
```

The package has a React peer dependency (`react` 17, 18, or 19).

## Initialize tracking

Mount the component once near the root of the application:

```tsx
import { DineoutTracking } from '@dineouticeland/do-tracking';

export function AppTracking({ restaurantSlug }: { restaurantSlug: string }) {
  return (
    <DineoutTracking
      companyIdentifier={restaurantSlug}
      platform="dineout"
    />
  );
}
```

`companyIdentifier` is the company ID or slug configured in Dineout Partner under **Company settings → Analytics → Online tracking**. It may resolve company-specific GA4, Meta Pixel, and Google Tag Manager destinations in addition to Dineout's site-wide destinations.

Company destinations are selected automatically from that restaurant's configuration:

| Configured restaurant IDs | Delivery |
| --- | --- |
| GA4 and/or Meta only | Directly to those destinations |
| GTM only | To that container's isolated data layer |
| GA4/Meta and GTM | Directly to GA4/Meta and also to GTM |
| None | Only to Dineout's platform destinations |

This lets one restaurant consume the library's GA4 events directly and enhance them with its own GTM events, while another restaurant can use GTM alone. Applications normally omit `companyTrackingMode`. The optional `direct`, `gtm`, and `both` overrides remain available for exceptional integrations and diagnostics; `auto` is the default.

If a restaurant's GTM container forwards the same event to the same GA4 property or Meta Pixel that is also configured directly, that restaurant will create duplicates. Remove the overlapping direct destination from its configuration, stop forwarding it in GTM, or use the `gtm` override for that integration.

The component initializes every destination ID once. When `companyIdentifier` changes, events wait for the new configuration and are not sent to the restaurant that was previously active.

## Page views

Page views are manual so single-page applications can report route changes exactly once. Pass the full browser URL, including the query string when it identifies a distinct page:

```tsx
import { useEffect } from 'react';
import { trackPageView } from '@dineouticeland/do-tracking';

export function RouteAnalytics({ routeKey }: { routeKey: string }) {
  useEffect(() => {
    trackPageView(window.location.href, document.title);
  }, [routeKey]);

  return null;
}
```

Active GA4 destinations receive `page_location`; active Meta pixels receive `PageView`; an active company GTM receives `page_view`; and active Mixpanel receives `Page Viewed`. The library disables automatic GA4 and Meta page views to prevent duplicates, and redacts UUID-shaped confirmation identifiers from page URLs. See Google's [GA4 page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views).

## Takeaway ecommerce

Use `trackTakeaway` for the order flow. It is also exposed as `window.trackTakeaway` for non-module consumers.

The public type exports include `DineoutTakeawayEvent`, `DineoutTakeawayEventMap`, and `TakeawayItem`, so wrappers can preserve the same event-to-payload relationship as `trackTakeaway`.

```tsx
import {
  trackTakeaway,
  type TakeawayItem,
} from '@dineouticeland/do-tracking';

const items: TakeawayItem[] = [
  {
    item_id: 'burger-101',
    item_name: 'Funky Burger',
    item_category: 'Burgers',
    item_variant: 'burger-101|patty:double|sauce:chili',
    item_list_id: 'main-menu',
    item_list_name: 'Main menu',
    price: 3290,
    quantity: 1,
    discount: 500,
  },
];

trackTakeaway('Takeaway Item Added', {
  restaurant_id: 'funkybhangra',
  restaurant_name: 'Funky Bhangra',
  cart_id: 'cart-4821',
  currency: 'ISK',
  fulfillment_type: 'pickup',
  value: 3290,
  items,
});
```

### Event map and firing points

Mixpanel keeps the descriptive library event name shown in the first column.

| Library event | Fire when | GA4/GTM event | Meta event |
| --- | --- | --- | --- |
| `Takeaway Menu Viewed` | Menu data has rendered, never while the loading shell is visible. | `view_item_list` | custom `ViewMenu` |
| `Takeaway Item Selected` | A product card is activated. | `select_item` | not sent |
| `Takeaway Item Viewed` | The product detail/drawer has rendered. | `view_item` | `ViewContent` |
| `Takeaway Item Added` | An explicit add succeeds, or quantity increases. Send only the positive delta. | `add_to_cart` | `AddToCart` |
| `Takeaway Item Removed` | Quantity decreases or a line is removed. Send only the removed delta. | `remove_from_cart` | custom `RemoveFromCart` |
| `Takeaway Cart Viewed` | The cart drawer or page is opened. | `view_cart` | custom `ViewCart` |
| `Takeaway Promo Applied` | The backend confirms the promo. | `takeaway_promo_applied` | custom `TakeawayPromoApplied` |
| `Takeaway Promo Rejected` | The backend rejects the promo. | `takeaway_promo_rejected` | custom `TakeawayPromoRejected` |
| `Takeaway Gift Card Applied` | The backend confirms gift-card redemption. | `takeaway_gift_card_applied` | custom `TakeawayGiftCardApplied` |
| `Takeaway Gift Card Rejected` | The backend rejects gift-card redemption. | `takeaway_gift_card_rejected` | custom `TakeawayGiftCardRejected` |
| `Takeaway Checkout Started` | A valid cart successfully reaches the checkout screen. | `begin_checkout` | `InitiateCheckout` |
| `Takeaway Payment Submitted` | A valid payment request has been handed to the provider. | `add_payment_info` | `AddPaymentInfo` |
| `Takeaway Payment Succeeded` | Confirmation data reports successful payment. | `takeaway_payment_succeeded` | custom `TakeawayPaymentSucceeded` |
| `Takeaway Payment Failed` | The payment provider/API returns a confirmed failure. | `takeaway_payment_failed` | custom `TakeawayPaymentFailed` |
| `Takeaway Order Completed` | The confirmation API reports that the backend accepted the order. | `purchase` | `Purchase` |

### Payload contract

All takeaway payloads carry restaurant and commerce context. TypeScript enforces the fields required by each event. The core fields are:

```ts
type TakeawayItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
  item_list_id?: string;
  item_list_name?: string;
  discount?: number;
};

type TakeawayPaymentFailureCode =
  | 'declined'
  | 'cancelled'
  | 'timeout'
  | 'provider_error'
  | 'unknown';

type TakeawayRejectionReasonCode =
  | 'invalid'
  | 'expired'
  | 'not_found'
  | 'not_applicable'
  | 'minimum_not_met'
  | 'already_redeemed'
  | 'usage_limit_reached'
  | 'insufficient_balance'
  | 'disabled'
  | 'provider_error'
  | 'unknown';
```

Commerce context includes `restaurant_id`, optional `restaurant_name` and `cart_id`, uppercase ISO-4217 `currency`, `fulfillment_type` (`pickup` or `delivery`), `items`, and numeric `value`. It may include `coupon`, `tax`, and `shipping`.

Event-specific fields are deliberately narrow:

- `Takeaway Promo Applied` requires `coupon`; `Takeaway Promo Rejected` never accepts the attempted coupon and may include a normalized `reason_code`.
- Gift-card events never accept a card code. The applied event may include the redeemed `gift_card_value`; a rejection may include a normalized `reason_code`.
- `Takeaway Payment Submitted` may include `payment_type`; `Takeaway Payment Succeeded` may include `order_id` and `payment_transaction_id`.
- `Takeaway Payment Failed` requires normalized `failure_code`.
- `Takeaway Order Completed` requires the backend's stable `order_id`.

```ts
trackTakeaway('Takeaway Order Completed', {
  restaurant_id: 'funkybhangra',
  restaurant_name: 'Funky Bhangra',
  cart_id: 'cart-4821',
  order_id: '104582',
  currency: 'ISK',
  fulfillment_type: 'pickup',
  value: 3290,
  tax: 783,
  shipping: 0,
  coupon: 'SUMMER',
  items,
});
```

The library derives GA4 `transaction_id` and a deterministic Meta `eventID` from `order_id`. The same completed order is sent at most once to each destination in the browser session, including when a confirmation component renders again or the page reloads. A destination configured later can still receive its missing copy.

The GA4/GTM shape follows Google's [recommended ecommerce event contract](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).

### Money, quantities, modifiers, and gift cards

- Use major currency units: `3290` means ISK 3,290 and `29.95` means USD 29.95.
- `price` is the final per-unit price after discount. `discount` is the per-unit discount. `value` is the authoritative item/cart/order value after discounts.
- Include selected modifiers in a stable `item_variant` value and include modifier charges in `price`.
- Send only the quantity delta for add/remove events. For example, changing quantity from 2 to 5 sends an added item with `quantity: 3`.
- Restoring a persisted cart does not emit `Takeaway Item Added`.
- A gift card being sold is a normal item with `item_category: 'gift_card'`. Redeeming a gift card is payment tender, not a coupon.
- An accepted zero-charge or gift-card-funded order still emits `Takeaway Order Completed`. `Takeaway Payment Succeeded` separately measures confirmed money movement.

### Takeaway application hook points

For the flow at `https://takeaway.dineout.is/:restaurant/order`, wire the events to these state transitions:

1. After menu data renders: `Takeaway Menu Viewed`.
2. On product-card activation, then product detail render: `Takeaway Item Selected`, then `Takeaway Item Viewed`.
3. In the cart reducer after a user-requested mutation succeeds: `Takeaway Item Added` or `Takeaway Item Removed`, using the quantity delta.
4. When the cart is opened: `Takeaway Cart Viewed`.
5. After the backend confirms a promo/gift-card attempt: the corresponding applied/rejected event.
6. After **Complete order** successfully navigates a valid cart to the customer/payment screen: `Takeaway Checkout Started`.
7. After the **Pay** action hands a valid request to the provider: `Takeaway Payment Submitted`.
8. When the provider/API confirms failure: `Takeaway Payment Failed` with a normalized failure code.
9. From confirmation API data: `Takeaway Payment Succeeded` when money movement is confirmed and `Takeaway Order Completed` when the order is accepted.

Use the numeric/stable backend order ID and the final receipt lines for completion. Never use a confirmation-route GUID as `order_id`.

### Privacy rules

Analytics payloads must not include customer names, email addresses, phone numbers, postal addresses, card data, confirmation GUIDs, raw provider errors, gift/clip-card codes, or failed promo-code values. Do not put these values in item names, IDs, coupons, variants, or custom properties. For rejections, send only an approved low-cardinality reason/failure code.

## Reservation tracking

Use `trackDineout` for reservation checkout and `trackDineoutDiscovery` for marketplace/selection events.

A confirmed reservation is a lead, not an ecommerce purchase:

```tsx
trackDineout('Reservation Completed', {
  restaurant_id: 'rest-123',
  reservation_id: 'res-456',
  payment_required: true,
});
```

This maps to GA4 `generate_lead` and Meta `Lead`. It includes reservation/restaurant context but no ecommerce revenue.

If a deposit is captured, emit a second event:

```tsx
trackDineout('Reservation Deposit Paid', {
  restaurant_id: 'rest-123',
  reservation_id: 'res-456',
  payment_transaction_id: 'pay-789',
  value: 2000,
  currency: 'ISK',
});
```

The deposit maps to GA4/Meta `Purchase` and produces one synthetic `reservation_deposit` item. Paid reservations emit both events; unpaid reservations emit only `Reservation Completed`. Confirmation conversions are deduplicated per reservation/transaction and destination.

Reservation funnel events use reservation-specific custom names instead of ecommerce events:

| Library event | GA4 | Meta |
| --- | --- | --- |
| `Reservation Flow Started` | `reservation_flow_started` | custom `ReservationFlowStarted` |
| `Reservation Time Selected` | `reservation_time_selected` | custom `ReservationTimeSelected` |
| `Reservation Checkout Loaded` | `reservation_checkout_loaded` | custom `ReservationCheckoutLoaded` |
| `Customer Details Submitted` | `reservation_customer_details_submitted` | custom `ReservationCustomerDetailsSubmitted` |
| `Reservation Payment Started` | `reservation_payment_started` | custom `ReservationPaymentStarted` |
| `Quick Book Clicked` | `quick_book_clicked` | custom `QuickBookClicked` |
| `Reservation Completed` | `generate_lead` | `Lead` |
| `Reservation Deposit Paid` | `purchase` | `Purchase` |

Existing date, guest, hold, redirect, verification, failure, and expiry mappings remain custom events. Sinna booking mappings are unchanged in v2.

## Google Tag Manager data layer

Whenever a restaurant has a GTM container configured (or the explicit `gtm`/`both` override is used), ecommerce events use the standard GTM shape. Each configured container has an isolated data layer, and the library clears stale ecommerce state immediately before each event:

```js
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: '104582',
    currency: 'ISK',
    value: 3290,
    tax: 783,
    shipping: 0,
    coupon: 'SUMMER',
    items: [
      {
        item_id: 'burger-101',
        item_name: 'Funky Burger',
        item_category: 'Burgers',
        item_variant: 'burger-101|patty:double|sauce:chili',
        price: 3290,
        quantity: 1,
        discount: 500,
      },
    ],
  },
});
```

Configure the GTM container to read the `ecommerce` object. If the restaurant also has direct GA4/Meta IDs configured, do not forward the same events from GTM to those same destinations unless duplicate delivery is explicitly intended.

## Destination payloads

The library adapts each event rather than forwarding one shared object unchanged:

- GA4 and GTM receive GA ecommerce fields such as `items`, `transaction_id`, `value`, and `currency`.
- Meta receives Pixel fields such as `content_ids`, `contents`, `content_type`, `value`, and `currency`, plus a deterministic `eventID` for conversion events.
- Mixpanel receives the descriptive library event name and safe business context.
- GA4 events use explicit `send_to` destination IDs, following Google's [multi-destination routing guidance](https://developers.google.com/tag-platform/gtagjs/routing); Meta uses the active Pixel ID for each call.

## Validation behavior

Invalid takeaway and deposit payloads are rejected before delivery. In particular, currency must be uppercase ISO-4217 text, numeric values must be finite and non-negative, quantities must be positive, required identifiers/items must be present, and failure codes must be normalized. TypeScript catches most mistakes at build time; runtime checks protect JavaScript consumers.

## Other APIs

- `trackSinna(...)`: typed Sinna service-booking events; semantics are unchanged in v2.
- `trackDineoutDiscovery(...)`: typed Dineout discovery, search, and reservation-selection events.
- `identifyUser(...)` / `reset()`: manage Mixpanel identity. Do not use email addresses or phone numbers as analytics identifiers.
- `dineoutTrack(...)` and `sendDineoutEvent(...)`: deprecated compatibility APIs. They route through the unified dispatcher once; new integrations should use the domain-specific functions.

See [MIGRATION.md](./MIGRATION.md) for the v1→v2 checklist. A manual browser harness with buttons for the full flow is available in [`src/example/TestApp.tsx`](./src/example/TestApp.tsx).

## Consent

Consent Mode and server-to-server delivery are outside this release. The consuming application must establish consent defaults before mounting `DineoutTracking` or sending events, and update consent when the user makes a choice. See Google's [consent setup guidance](https://developers.google.com/tag-platform/security/guides/consent).

## Build and test

```bash
pnpm test
pnpm build
```

After the takeaway application adopts v2, validate the implementation in GA4 DebugView, Tag Assistant/GTM Preview, and Meta Test Events.
