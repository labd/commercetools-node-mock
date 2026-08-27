---
"@labdigital/commercetools-mock": minor
---

Model `purchaseOrderNumber` on carts: store it from `CartDraft` and support the
`setPurchaseOrderNumber` update action.

B2B checkout captures the buyer's purchase order number on the cart before the
order exists, but the mock dropped the draft field and rejected the action, so
that write path had no coverage available. The cart's `purchaseOrderNumber` now
also carries through to an order created from it, the way it does on
commercetools.
