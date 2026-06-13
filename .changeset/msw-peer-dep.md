---
"@labdigital/commercetools-mock": major
---

Declare `msw` as a peer dependency (`^2.14.6`) instead of a bundled runtime dependency. The mock creates msw request handlers (via `ctMock`) that consumers register into their own `setupServer`, so the handler factory and the consumer's server must resolve to a single shared msw instance. Bundling msw as a direct dependency allowed package managers to install a second, isolated copy whenever the consumer pinned a different msw version — handlers created by one copy then silently fail to match requests intercepted by the other (e.g. the `/oauth/*` token handler no longer matching `/oauth/token`).

**Migration:** add `msw` (`^2.14.6` or newer) to your own dependencies. Most consumers already depend on msw for their test setup.
