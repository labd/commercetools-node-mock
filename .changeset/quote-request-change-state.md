---
"@labdigital/commercetools-mock": minor
---

Support the `changeQuoteRequestState` update action on quote requests.

The quote-request update handler implemented `setCustomField`, `setCustomType`
and `transitionState`, but not `changeQuoteRequestState` — so a buyer
cancelling a quote request, which maps to that action, could not be exercised
against the mock. `transitionState` is not a substitute: it moves a quote
request through a custom State machine, while `changeQuoteRequestState` sets
the built-in `quoteRequestState` enum.
