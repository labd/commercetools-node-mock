---
"@labdigital/commercetools-mock": minor
---

Add support for `External` and `ExternalAmount` tax modes on carts.

### New behavior

- **`External` tax mode** — `LineItem`, `CustomLineItem`, and shipping methods can now carry an `externalTaxRate`:
  - `createCart` honors `LineItemDraft.externalTaxRate`, `CustomLineItemDraft.externalTaxRate`, and `CartDraft.externalTaxRateForShippingMethod`.
  - `addLineItem`, `addCustomLineItem`, and `setShippingMethod`/`setCustomShippingMethod` accept `externalTaxRate`.
  - New update actions: `setLineItemTaxRate`, `setCustomLineItemTaxRate`, `setShippingMethodTaxRate`.
- **`ExternalAmount` tax mode** — explicit gross amounts can be supplied per item and at the cart level:
  - New update actions: `setLineItemTaxAmount`, `setCustomLineItemTaxAmount`, `setShippingMethodTaxAmount`, `setCartTotalTax`.
  - In this mode the cart's `taxedPrice` is whatever `setCartTotalTax` last set; it is no longer aggregated from line items. `taxedShippingPrice` continues to mirror `shippingInfo.taxedPrice`.
- All tax calculations now respect `cart.taxRoundingMode` (`HalfEven` / `HalfUp` / `HalfDown`) instead of always using `Math.round`.

### Cart total recomputation after update actions

`CartUpdateHandler.apply` now recomputes `cart.taxedPrice` and `cart.taxedShippingPrice` after every update batch (except in `ExternalAmount` mode, where the cart total is authoritative via `setCartTotalTax`).

This fixes a pre-existing latent bug: previously these fields were only computed once during `create()` and were never refreshed after update actions, so e.g. running `setShippingMethod` after cart creation would leave the cart-level aggregate stale. It didn't show up before because `LineItem.taxedPrice` was never populated in any mode, so the aggregate had no contributors that could drift. With the new tax-mode work, line items and custom line items now actually carry `taxedPrice`, which made the gap observable and required fixing.
