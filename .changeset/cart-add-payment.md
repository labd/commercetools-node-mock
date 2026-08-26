---
"@labdigital/commercetools-mock": minor
---

Support the `addPayment` and `removePayment` update actions on carts, and
`removePayment` on orders.

`addPayment` existed only on the order handler, so the payment-first checkout
flow — attach the payment to the cart, then create the order from the provider
callback — could not be exercised against the mock. Because carts and `/me`
carts share a repository, both scopes get the actions. `removePayment` was
missing on carts and orders alike and is the natural pair.
