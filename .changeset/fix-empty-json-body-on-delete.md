---
"@labdigital/commercetools-mock": patch
---

Fix Fastify rejecting DELETE requests with an empty JSON body by adding a custom content-type parser that tolerates empty bodies.
