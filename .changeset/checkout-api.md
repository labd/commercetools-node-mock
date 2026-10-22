---
"@labdigital/commercetools-mock": minor
---

Mock the commercetools Checkout API's applications and payment integrations, under `/{projectKey}/applications` and `/{projectKey}/payment-integrations`. With MSW they are served on the new `checkoutHost` option, `https://checkout.*.commercetools.com` by default. Their types come from `@commercetools/checkout-sdk`, an optional peer dependency. A payment integration created without an automated reversal configuration gets one with status `Inactive`, as Checkout answers.
