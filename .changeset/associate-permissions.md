---
"@labdigital/commercetools-mock": major
---

Scope the `/me` and `as-associate` endpoints to the caller, and fail closed.

**This is a breaking change.** Both scopes used to answer from the whole
collection: `/me/orders/{id}` returned any order, and an associate-scoped
request accepted any `associateId` and ignored the business unit in the path.
A test asserting that a shopper cannot read someone else's order, or that an
associate cannot see a colleague's cart, passed whether or not the code under
test actually scoped its request.

**`/me`** now answers for the customer or anonymous session the bearer token was
issued for, and returns `403 insufficient_scope` without one. A resource
belonging to someone else is `404`, not a leak. Resources created through `/me`
are stamped with the caller.

**`as-associate`** resolves the associate named in the path against the business
unit named in the path, collects the permissions of their AssociateRoles, and
enforces all 47 of them. `My` means the resource's customer is the acting
associate; `Others` means a different customer in the same business unit. A list
request with only the `My` permission is narrowed rather than refused; anything
else missing returns `403 AssociateMissingPermission` carrying the permissions
that would have sufficed. A resource of another business unit is `404`.

**Migrating.** Tests that call these endpoints now need to say who is calling.
A new `@labdigital/commercetools-mock/testing` entrypoint exports
`customerSession`, `loginCustomer` and `anonymousSession` for `/me`, and
`createAssociateScope` for the associate scope, which seeds the customer,
associate role and business unit in one call.

Identity resolution no longer depends on `enableAuthentication`: the mock always
reads the identity from a token it issued, so scoping works without turning
authentication on.

Also in this change, because the scopes are unusable without them:

- `POST /oauth/{projectKey}/anonymous/token` honours a supplied `anonymous_id`
  instead of always generating one.
- `PaymentDraft.customer` and `anonymousId` are stored.
- An order and a quote request created from a cart carry the cart's
  `businessUnit`.
- `GET /me/active-cart` answers for the caller instead of returning the first
  active cart in the project.
