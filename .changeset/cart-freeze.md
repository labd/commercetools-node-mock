---
"@labdigital/commercetools-mock": minor
---

Support the `freezeCart` and `unfreezeCart` update actions on carts.

`cartState: "Frozen"` was unreachable, so a checkout that freezes a cart while a
payment is in flight could not be exercised — and, worse, a test asserting that
a code path left the cart alone passed whether or not the guard existed.

`freezeCart` requires the cart to be `Active` and `unfreezeCart` requires it to
be `Frozen`; both raise `InvalidOperation` otherwise. While a cart is frozen,
update actions that would change what it costs are rejected with
`InvalidOperation`, matching the documented purpose of freezing. Actions that
leave the price alone (`setCustomerEmail`, `setCustomField`, addresses, …) are
still applied, and `unfreezeCart` earlier in the same action list lifts the
restriction for the actions that follow it.
