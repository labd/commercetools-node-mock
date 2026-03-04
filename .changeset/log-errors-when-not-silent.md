---
"@labdigital/commercetools-mock": patch
---

Route all error responses through the central error handler by converting direct
`reply.status(4xx).send()` calls to throw `CommercetoolsError` instead. This
ensures all error responses are logged when the `silent` option is set to `false`
and provides consistent error response bodies with `statusCode`, `message`, and
`errors` fields.
