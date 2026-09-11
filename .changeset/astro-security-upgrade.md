---
"@labdigital/commercetools-mock": patch
---

Fix an invalid `msw` peer dependency range. `">= 2.14.6, < 3.0.0"` is not a valid semver range — a comma is not a range separator — so tools resolving it could not evaluate the constraint. It is now `">=2.14.6 <3.0.0"`, which expresses the same intent.
