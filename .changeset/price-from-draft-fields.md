---
"@labdigital/commercetools-mock": minor
---

Map the remaining `PriceDraft` fields when creating prices.

`priceFromDraft` only carried `key`, `country`, `value` and `channel`, so
`customerGroup`, `validFrom`, `validUntil`, `discounted`, `tiers`, `custom` and
`recurrencePolicy` were silently dropped — a price created with a customer group
read back without one, which makes customer-group price selection untestable.

The order import used a second, even smaller mapping (`createPrice`, which kept
only the value). Both paths now go through `priceFromDraft`.
