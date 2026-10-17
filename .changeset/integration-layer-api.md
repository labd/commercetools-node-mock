---
"@labdigital/commercetools-mock": minor
---

Mock the Commerce Integration Layer's management API under `/{projectKey}/main`: session defaults and checkout rules (`settings`, `checkout`), hidden fields (`schema/visibility`, listing the fields of the Project's Types and Product Types), the IdP login (`idp`), the extension config and the allowlist. With MSW it is served on the new `integrationLayerHost` option, `https://extensions.integration-layer.*.commercetools.com` by default. commercetools publishes no spec for this API yet, so the mock follows the one the commercetools Go SDK generates its `integrationlayer` package from. Every Project is taken as enrolled, and the state is held in memory whatever the storage. MSW now also forwards PUT and PATCH requests.
