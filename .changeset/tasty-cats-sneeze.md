---
"@labdigital/commercetools-mock": minor
---

Implements the following previously missing BusinessUnit update action handlers:
- `removeShippingAddressId` - Remove an address ID from shipping addresses
- `addBillingAddressId` - Add an address ID to billing addresses
- `removeBillingAddressId` - Remove an address ID from billing addresses
- `setDefaultBillingAddress` - Set the default billing address
- `setCustomField` - Set a custom field value on the business unit
- `setAddressCustomField` - Set a custom field value on a specific address
- `setAddressCustomType` - Set the custom type for a specific address
- `removeAssociate` - Remove an associate from the business unit
- `changeAssociate` - Change an existing associate's role assignments

Fixes the `changeAddress` action to properly replace an existing address instead of adding a new one.
