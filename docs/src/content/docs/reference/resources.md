---
title: API coverage & limitations
description: The mock aims to implement the commercetools HTTP API cleanly. This page lists what is not yet supported and the known behavioural differences.
---

The goal of `@labdigital/commercetools-mock` is to implement the commercetools
HTTP API **cleanly and completely**, so you interact with it exactly as
documented in the official
[commercetools API reference](https://docs.commercetools.com/api/) — the same
endpoints, drafts, update actions and query parameters. There is no separate
resource catalog to learn.

In practice the mock is comprehensive but not yet exhaustive. This page lists
the areas where behaviour currently **differs** from production. If something
isn't listed here, assume it should behave like commercetools — and please
[open an issue](https://github.com/labd/commercetools-node-mock/issues) if it
doesn't.

## Not yet implemented

These are **gaps on the way to full parity**, not deliberate design choices —
they're candidates for implementation and contributions are very welcome. Until
then, don't rely on them in tests.

| Area | Current gap |
| --- | --- |
| **`sort`** | Ignored on all list, projection and search endpoints — results come back in insertion order. |
| **`withTotal`** | Ignored — `total` is always computed and returned. |
| **`limit`** | No maximum is enforced (the real API caps at 500). Default is `20`. |
| **`where` predicates** | Unknown fields don't error (they yield no match), so typos aren't caught. |
| **`expand`** | Multi-dimensional arrays (arrays-of-arrays) aren't resolved. |
| **Product Search** | No relevancy/scoring, boosting, facet filtering, fuzzy or full wildcard; full-text is substring matching; `facets` is always `[]`. |
| **Product Projection Search** | `fuzzy`, `localeProjection` and `storeProjection` are ignored; range and filtered facets only work on `variants.*` sources. |
| **Order Search** | The query body is ignored — all orders are returned, paginated (hits carry `id` and `version` only). |
| **Missing endpoints / actions** | Not every endpoint or update action exists yet; the mock returns an error rather than silently succeeding. |

## Intentional differences

A few things are deliberately relaxed because the mock is a **testing** tool:

| Area | Behaviour | Why |
| --- | --- | --- |
| **Credential validation** | Client id/secret are not verified, and `expires_in` (48h) is never enforced. | Keeps test setup simple; opt into stricter checks with `validateCredentials`. See [Authentication](/commercetools-node-mock/configuration/authentication/). |
| **`/me` identity** | The current customer comes from the request payload, not the token's `customer_id` scope. | Tokens aren't tied to per-customer isolation in the mock. |

Think one of the "not yet implemented" items should just work? It probably
should — [open an issue](https://github.com/labd/commercetools-node-mock/issues)
or send a PR. The goal is complete, faithful coverage.
