---
"@labdigital/commercetools-mock": minor
---

Validate subscription destinations per type, and support the remaining
subscription update actions.

The generated `DestinationSchema` only carries the `type` discriminator, because
the spec models `Destination` as a union — so in strict mode a subscription
draft could be missing everything its destination needs (an SQS destination
without a `region`, say) and still be accepted. The destination is now validated
as a discriminated union over the seven destination types.

`changeDestination`, `setChanges`, `setEvents` and `setMessages` are implemented;
`setKey` was the only update action the handler had.
