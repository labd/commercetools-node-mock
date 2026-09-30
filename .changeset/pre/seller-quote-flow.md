---
"@labdigital/commercetools-mock": minor
---

Support the seller's side of the quote flow:

- Staged quotes and quotes are now stored when created, so they can be read and updated afterwards.
- A staged quote is created from a submitted quote request only, checks `quoteRequestVersion`, prices the offer in a copy of the requested cart, and honours `quoteRequestStateToAccepted`.
- A quote is created in the `Pending` state (it was `Accepted`) from an `InProgress` staged quote only, checks `stagedQuoteVersion`, carries the staged quote's `validTo`, `sellerComment`, business unit and store, and honours `stagedQuoteStateToSent`.
- New staged quote update actions: `changeStagedQuoteState`, `setSellerComment` and `setValidTo`.
- New quote update actions: `changeQuoteState` and `requestQuoteRenegotiation`. `DeclinedForRenegotiation` can only be reached through a renegotiation request.
