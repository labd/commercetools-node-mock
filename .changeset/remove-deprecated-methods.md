---
"@labdigital/commercetools-mock": major
---

Remove deprecated `start()`, `stop()`, and `add()` methods. Use `registerHandlers()` to bind to an msw server and `unsafeAdd()` for adding resources directly.
