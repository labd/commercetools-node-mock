---
"@labdigital/commercetools-mock": minor
---

Implement the product-projection suggest endpoint,
`GET /{projectKey}/product-projections/suggest`.

Suggestions come from the products' `searchKeywords` for each requested locale.
Matching is a case-insensitive prefix match on the keyword's tokens, so a
keyword only matches mid-word when it carries a `whitespace` or `custom`
`suggestTokenizer` — the same rule as commercetools. `fuzzy` allows edits up to
`fuzzyLevel`, defaulting to the level commercetools derives from the length of
the search term, and `staged` and `limit` are honoured. A request without a
`searchKeywords.{language}` parameter is rejected with `InvalidInput`.

No search dependency was added; the matching is a few lines in the repository.
