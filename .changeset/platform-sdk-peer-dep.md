---
"@labdigital/commercetools-mock": minor
---

Declare `@commercetools/platform-sdk` as a peer dependency (`>=8.25.0`) instead of a dev-only dependency. The published type declarations reference the SDK's types, so consumers using TypeScript need it installed to resolve them. Make sure `@commercetools/platform-sdk` is present in your project (most consumers already have it).
