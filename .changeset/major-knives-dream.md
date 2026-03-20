---
"@labdigital/commercetools-mock": patch
---

Made generated optional fields nullish instead of optional, as the commercetools API also accepts null as input and treats it as empty, but the mock explicitly expects undefined
