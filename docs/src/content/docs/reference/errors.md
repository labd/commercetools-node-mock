---
title: Errors
description: How the mock represents commercetools errors, including CommercetoolsError and status codes.
---

When a request fails, the mock responds with a commercetools-style error body
and an appropriate HTTP status code, so error-handling code in your integration
is exercised the same way it would be against the real API.

## `CommercetoolsError`

Internally, errors are represented by `CommercetoolsError`, which carries:

| Field | Type | Description |
| --- | --- | --- |
| `message` | `string` | Human-readable message. |
| `statusCode` | `number` | HTTP status (defaults to `400`). |
| `info` | `BaseError` | The primary error object. |
| `errors` | `BaseError[]` | Additional error details. |

## Response shape

Errors are serialised to the standard commercetools error envelope:

```json
{
  "statusCode": 400,
  "message": "…",
  "errors": [
    { "code": "…", "message": "…" }
  ]
}
```

Unexpected (non-`CommercetoolsError`) failures return `500` with an `error`
field.

## Common cases

| Situation | Status | Notes |
| --- | --- | --- |
| Malformed `where` predicate | `400` | `InvalidInput`. |
| `expand` target not found | `400`/`404` | `ReferencedResourceNotFound`. |
| Update on missing resource | `404` | `ResourceNotFound`. |
| Missing/unknown token (when `validateCredentials`) | `401` | `invalid_token`. See [Authentication](/commercetools-node-mock/configuration/authentication/). |
| Bad customer credentials (password grant) | `400` | `invalid_customer_account_credentials`. |
| Missing Basic auth on `/oauth` | `401` | `invalid_client`. |
| Unsupported grant type | `400` | `unsupported_grant_type`. |

## Asserting on errors

Because the SDK throws on non-2xx responses, you can assert on the thrown error
in your tests:

```typescript
await expect(fetchMissingCustomer()).rejects.toMatchObject({
  statusCode: 404,
})
```
