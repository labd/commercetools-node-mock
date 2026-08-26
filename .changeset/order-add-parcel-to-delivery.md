---
"@labdigital/commercetools-mock": minor
---

Support the `addParcelToDelivery` update action on orders.

Parcels could only be supplied inline through `addDelivery`, so adding one to a
delivery that already exists — which is what happens when a shipment is handed
over in parts — had no route. The action accepts either `deliveryId` or
`deliveryKey`, and rejects an unknown delivery instead of quietly doing nothing.
