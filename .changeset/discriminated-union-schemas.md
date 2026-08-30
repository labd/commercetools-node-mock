---
"@labdigital/commercetools-mock": minor
---

Generate real discriminated unions for small unions in the draft schemas.

The generator collected the variants of a discriminated union as dependencies
but then emitted only the flattened base shape, so `business-unit.ts` imported
`CompanyDraftSchema` and `DivisionDraftSchema` without ever referencing them —
`pnpm generate:schemas` produced a file biome rejected as having unused imports.

Unions with five or fewer variants are now emitted as
`z.discriminatedUnion(...)`, and each variant gets a literal discriminator
property instead of the shared enum. This validates what the flattened shape
could not: in strict mode a `Division` business unit without `parentUnit` is now
a 400 `parentUnit: Missing required value` rather than a 500, and an unknown
`unitType` reports the valid discriminator values. The same applies to cart
discount values, product discount values, extension destinations, shipping rate
input drafts and tiers, recurrence policy schedules, recurring order scopes,
delivery formats and HTTP destination authentication.

Larger unions (`AttributeType`, `FieldType`, `StagedOrderUpdateAction`,
`Reference` and friends) still flatten, as enumerating dozens of variants adds
little validation value.
