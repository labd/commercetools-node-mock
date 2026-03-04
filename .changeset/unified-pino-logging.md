---
"@labdigital/commercetools-mock": minor
---

Unify logging to use Pino (via Fastify's built-in logger) instead of
console.error. Add support for passing a custom Pino logger instance via the
new `logger` option on `CommercetoolsMockOptions`. The standalone server now
uses pino-pretty for human-readable output.
