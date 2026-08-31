---
title: Authentication
description: How the mock's OAuth2 server behaves, the enableAuthentication and validateCredentials options, token endpoints and customer/anonymous grants.
---

The mock ships a working OAuth2 server so the commercetools SDK's token flows
succeed. By default authentication is **relaxed** — tokens are issued but not
required or verified — which is what most tests want. You can tighten it with
two options.

## The two options

| Option | Default | Effect |
| --- | --- | --- |
| `enableAuthentication` | `false` | When `true`, API routes require the request to be checked for a bearer token. When `false`, API requests need no `Authorization` header at all. |
| `validateCredentials` | `false` | When `true` *and* `enableAuthentication` is on, a bearer token that was actually issued by the mock is required. When `false`, tokens are optional and never verified. |

### Behaviour matrix (API/data requests)

| `enableAuthentication` | `validateCredentials` | Behaviour |
| --- | --- | --- |
| `false` (default) | *(any)* | No auth enforced. No `Authorization` header needed on API requests. |
| `true` | `false` | Token optional and unverified. If a recognised token is sent, the associated `clientId` is recorded on `createdBy`/`lastModifiedBy`. |
| `true` | `true` | A bearer token issued by the mock is **required**. Missing or unknown token → `401 invalid_token`. |

:::note
`enableAuthentication` only guards the **API** routes. The `/oauth/*` token
endpoints always require HTTP Basic client credentials, even when
authentication is disabled (see the gotchas below).
:::

## Token endpoints

The OAuth2 server is mounted under `/oauth` and exposes:

| Endpoint | Grant types | Purpose |
| --- | --- | --- |
| `POST /oauth/token` | `client_credentials`, `refresh_token` | Standard client and refresh tokens. |
| `POST /oauth/{projectKey}/customers/token` | `password` | Customer (password) sign-in token. |
| `POST /oauth/{projectKey}/in-store/key={storeKey}/customers/token` | `password` | In-store customer token. |
| `POST /oauth/{projectKey}/anonymous/token` | `client_credentials` | Anonymous session token. |

All of these require an HTTP **Basic** `Authorization` header carrying the client
id/secret — but see the gotcha: **the id/secret values are not validated**, any
non-empty pair is accepted.

### Issued token shape

```json
{
  "access_token": "<random base64>",
  "token_type": "Bearer",
  "expires_in": 172800,
  "scope": "<requested scope, or \"todo\" if none>",
  "refresh_token": "my-project-<random>"
}
```

Tokens are held in memory and are accessible from your test through
`ctMock.authStore()`.

## Client credentials flow

With the default options this "just works" — the SDK requests a token, the mock
issues one, and API requests succeed without any bearer check. To require valid
tokens:

```typescript
const ctMock = new CommercetoolsMock({
  defaultProjectKey: 'my-project',
  enableAuthentication: true,
  validateCredentials: true,
})
```

Now every API request must carry a bearer token that the mock issued (i.e. the
SDK must have completed a token request first). Requests without one get
`401 invalid_token`.

## Customer (password) grant

The customer token endpoint validates the supplied `username`/`password`
against the customers that exist in the project. Create the customer first
through the API:

```typescript
await apiRoot
  .customers()
  .post({ body: { email: 'jane@example.com', password: 's3cret' } })
  .execute()
```

A matching customer yields a token whose scope carries `customer_id:<id>`; no
match returns `400 invalid_customer_account_credentials`. That `customer_id` is
what the `/me` endpoints answer for — see [Scoped endpoints](#scoped-endpoints).

## Anonymous grant

`POST /oauth/{projectKey}/anonymous/token` issues a token with an
`anonymous_id:<uuid>` appended to the scope — useful for testing anonymous cart
flows. Pass `anonymous_id` yourself to continue an existing session.

## Scoped endpoints

The `/me` and `as-associate` endpoints answer for a particular caller, and both
**fail closed**: a request that does not establish who is asking is refused
rather than served from the whole collection. Returning another customer's order
to an unidentified caller would make an ownership test pass without asserting
anything.

### `/me`

The caller is the customer (or anonymous session) the bearer token was issued
for. Without such a token, `/me` returns `403 insufficient_scope`.

```typescript
import { customerSession } from '@labdigital/commercetools-mock/testing'

const { headers } = customerSession(ctMock, customer.id)

await ctMock.app.inject({ method: 'GET', url: '/my-project/me/orders', headers })
```

`loginCustomer` does the same through the password grant when you want to
exercise sign-in, and `anonymousSession` starts an anonymous one. Resources
created through `/me` are stamped with the caller, so they can be read back.

### `as-associate`

The caller is the associate named in the path,
`/as-associate/{associateId}/in-business-unit/key={key}/…`. The mock resolves
the business unit, finds that associate on it, and collects the permissions of
their AssociateRoles. What each request needs follows commercetools:

- The `My` permission (`ViewMyOrders`) covers resources whose customer is the
  associate; the `Others` permission (`ViewOthersOrders`) covers the rest of the
  business unit.
- A list request with only the `My` permission is narrowed to the caller instead
  of being refused.
- Missing permissions return `403 AssociateMissingPermission`, carrying the
  permissions that would have sufficed.
- A resource of another business unit is `404`, not `403`.

`createAssociateScope` seeds the customer, role and business unit for you:

```typescript
import { createAssociateScope } from '@labdigital/commercetools-mock/testing'

const scope = await createAssociateScope(ctMock, {
  permissions: ['ViewMyCarts', 'CreateMyCarts'],
})

await ctMock.app.inject({ method: 'GET', url: `${scope.basePath}/carts` })
```

## Gotchas & limitations

These differ from real commercetools and are worth knowing when writing tests:

- **Client id/secret are never verified.** Any non-empty Basic credentials are
  accepted by the token endpoints. Use `validateCredentials` if you want to
  assert that a token was obtained before API calls.
- **`enableAuthentication` does not protect the token endpoints** — they always
  require a Basic header regardless.
- **`expires_in` is always `172800` (48h) and is never enforced.** Token expiry
  cannot be simulated; `validateCredentials` only checks that a token exists.
- **Scope defaults to the literal `"todo"`** for client tokens when none is
  requested.
- **Identity resolution is independent of `enableAuthentication`.** The mock
  always reads the identity out of a bearer token it issued, so `/me` and
  `as-associate` can be scoped without turning on authentication. Turning
  `validateCredentials` on additionally *requires* a token on every API call.

See also: [API coverage & limitations](/commercetools-node-mock/reference/resources/).
