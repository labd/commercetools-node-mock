---
"@labdigital/commercetools-mock": patch
---

`clear()` now also resets the auth store. Tokens issued before a `clear()` used to stay valid and keep resolving to customers and anonymous sessions that no longer existed, leaking identity between tests. Tests that issue a token (for example through `customerSession`) must do so after each `clear()`.
