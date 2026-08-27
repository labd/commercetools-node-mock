---
"@labdigital/commercetools-mock": minor
---

Add the associate-scoped quote routes.

The associate scope covered quote requests but not quotes, so any
`.asAssociate().…​.quotes()` read returned a 404 and the correct way to read a
colleague's quote was the one path that could not be tested. The service
registers what commercetools documents for associate quotes — query, get by id,
get by key, update by id and update by key — and no create or delete route,
since quotes are created by the seller.
