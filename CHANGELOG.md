## 2.23.1

## 2.40.0

### Minor Changes

- [#249](https://github.com/labd/commercetools-node-mock/pull/249) [`280f73a`](https://github.com/labd/commercetools-node-mock/commit/280f73aa045b7e9ed5058f95110ae6cbb47e04a3) Thanks [@jsm1t](https://github.com/jsm1t)! - Add support for setting stores on customers

## 2.39.0

### Minor Changes

- [#242](https://github.com/labd/commercetools-node-mock/pull/242) [`c970b6e`](https://github.com/labd/commercetools-node-mock/commit/c970b6e008b5571cae07d5646bb9251f13fd75c3) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added cart discount set stores support

## 2.38.0

### Minor Changes

- [#245](https://github.com/labd/commercetools-node-mock/pull/245) [`ac90ac3`](https://github.com/labd/commercetools-node-mock/commit/ac90ac32d3a33c22b94a4f97fd100f379f4714f6) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve mocking of customer updates. This includes adding support for
  `removeAddress`, `removeBillingAddressId`, `removeShippingAddressId`,
  `setCustomerGroup`, `setDateOfBirth`, `setDefaultShippingAddress`,
  `setDefaultBillingAddress`, `setMiddleName`, `setTitle`.

- [`d9cc9b1`](https://github.com/labd/commercetools-node-mock/commit/d9cc9b1e4f712a5f77c3366ff36b15f09dd8cf99) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Use type-safe quality operators (`===`)

### Patch Changes

- [#243](https://github.com/labd/commercetools-node-mock/pull/243) [`3a148e0`](https://github.com/labd/commercetools-node-mock/commit/3a148e03fd1854e2eae3b5539f7fe25d57040613) Thanks [@jsm1t](https://github.com/jsm1t)! - Fix for defaultBillingAddress & defaultShippingAddress customer create options not working

## 2.37.0

### Minor Changes

- [#236](https://github.com/labd/commercetools-node-mock/pull/236) [`d11863d`](https://github.com/labd/commercetools-node-mock/commit/d11863d759036f82c1028184f01ac8b11cc182ac) Thanks [@saraghaedi](https://github.com/saraghaedi)! - add handler for creating in-store customer token

- [#241](https://github.com/labd/commercetools-node-mock/pull/241) [`1c9f082`](https://github.com/labd/commercetools-node-mock/commit/1c9f082c6219ac2c30039fd9049bcf2bcd503213) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added support for more search indexes on projects

## 2.36.0

### Minor Changes

- [#237](https://github.com/labd/commercetools-node-mock/pull/237) [`a0525a4`](https://github.com/labd/commercetools-node-mock/commit/a0525a4a25daa9f32d985e6e6e1968f19860a826) Thanks [@saraghaedi](https://github.com/saraghaedi)! - implement my business unit service

- [#238](https://github.com/labd/commercetools-node-mock/pull/238) [`b86edf4`](https://github.com/labd/commercetools-node-mock/commit/b86edf48ddc9fc3e43d04f0863c5aba4fc8f929c) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add ability to set shipping and billing addresses when creating customer

## 2.35.0

### Minor Changes

- [#234](https://github.com/labd/commercetools-node-mock/pull/234) [`83dd885`](https://github.com/labd/commercetools-node-mock/commit/83dd885ad5ff6f121c7a9d1ac3f55ef084b7170c) Thanks [@mickdekkers](https://github.com/mickdekkers)! - Populate cart.shippingInfo when setShippingMethod is called

## 2.34.3

### Patch Changes

- [#232](https://github.com/labd/commercetools-node-mock/pull/232) [`860a1b5`](https://github.com/labd/commercetools-node-mock/commit/860a1b538aa674b8b39b089cb540cd2b9e11e886) Thanks [@davidweterings](https://github.com/davidweterings)! - Set store key reference on create cart

## 2.34.2

### Patch Changes

- [#230](https://github.com/labd/commercetools-node-mock/pull/230) [`a8ae588`](https://github.com/labd/commercetools-node-mock/commit/a8ae5889389f3102bbe1ae81fc3eda8db1f27cf5) Thanks [@webwiebe](https://github.com/webwiebe)! - copy properties from cart to order on create from cart

## 2.34.1

### Patch Changes

- [#228](https://github.com/labd/commercetools-node-mock/pull/228) [`de9d25d`](https://github.com/labd/commercetools-node-mock/commit/de9d25de1744100245dfee881bddfd32679112ea) Thanks [@alexfaxe](https://github.com/alexfaxe)! - Reverts breaking change

## 2.34.0

### Minor Changes

- [#226](https://github.com/labd/commercetools-node-mock/pull/226) [`a86d8c3`](https://github.com/labd/commercetools-node-mock/commit/a86d8c340380b2b15cd648215e9d4fb22ffa5e05) Thanks [@alexfaxe](https://github.com/alexfaxe)! - Removes the light-my-request dependency

## 2.33.1

### Patch Changes

- [#224](https://github.com/labd/commercetools-node-mock/pull/224) [`1177aa1`](https://github.com/labd/commercetools-node-mock/commit/1177aa1b26cb52e443868da18d79cb5f254ed462) Thanks [@webwiebe](https://github.com/webwiebe)! - Added the setShippingAddressCustomType and setBillingAddressCustomType actions to the cart repository

## 2.33.0

### Minor Changes

- [#221](https://github.com/labd/commercetools-node-mock/pull/221) [`70fee89`](https://github.com/labd/commercetools-node-mock/commit/70fee89ccae1eff09a4534bf118a2c3e120daf5e) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for "setPurchaseOrderNumber" order update action

## 2.32.0

### Minor Changes

- [#219](https://github.com/labd/commercetools-node-mock/pull/219) [`0fd9b7b`](https://github.com/labd/commercetools-node-mock/commit/0fd9b7b4b43ac79f083dc9cdc220efc185aaa56a) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for "addAddress", "addBillingAddressId" and "addShippingAddressId" customer update actions

## 2.31.2

### Patch Changes

- [#217](https://github.com/labd/commercetools-node-mock/pull/217) [`d5709d1`](https://github.com/labd/commercetools-node-mock/commit/d5709d1fb5c45684b3f2ce2009c3fbebd2f9b2e2) Thanks [@callumhemming](https://github.com/callumhemming)! - allows addedAt override in add to cart and add to wishlist

## 2.31.1

### Patch Changes

- [#215](https://github.com/labd/commercetools-node-mock/pull/215) [`4162caa`](https://github.com/labd/commercetools-node-mock/commit/4162caa9560b24981f1de8d58df5f3384a3d5464) Thanks [@alexfaxe](https://github.com/alexfaxe)! - Adds support for custom fields in 'addLineItem'

## 2.31.0

### Minor Changes

- [#213](https://github.com/labd/commercetools-node-mock/pull/213) [`aefebc7`](https://github.com/labd/commercetools-node-mock/commit/aefebc73ae155de4a646bd6cc0e5ab17b3be5a73) Thanks [@jsm1t](https://github.com/jsm1t)! - Add filtering with search query to product search

## 2.30.1

### Patch Changes

- [#211](https://github.com/labd/commercetools-node-mock/pull/211) [`91b0255`](https://github.com/labd/commercetools-node-mock/commit/91b0255239141c6f251c648414204d834481b0d5) Thanks [@yugaWicaksono](https://github.com/yugaWicaksono)! - Added missing test OrderChangeShipmentStateAction in order action

## 2.30.0

### Minor Changes

- [#209](https://github.com/labd/commercetools-node-mock/pull/209) [`2b74155`](https://github.com/labd/commercetools-node-mock/commit/2b741559ba28f16725ed2f8d940378d305b2f06f) Thanks [@borisvankatwijk](https://github.com/borisvankatwijk)! - Addition of "products/search" POST endpoint. Also known as "Storefront Search -> Product Search".

## 2.29.1

### Patch Changes

- [#207](https://github.com/labd/commercetools-node-mock/pull/207) [`28bca80`](https://github.com/labd/commercetools-node-mock/commit/28bca80473015efaae94e918f4c998f6ddd06629) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added additional options to project settings

## 2.29.0

### Minor Changes

- [#199](https://github.com/labd/commercetools-node-mock/pull/199) [`be62944`](https://github.com/labd/commercetools-node-mock/commit/be62944a5e47e03ce9ed59ea24cfee790d95320e) Thanks [@leongraumans](https://github.com/leongraumans)! - add support for "setProductPriceCustomField" product update action

## 2.28.1

### Patch Changes

- [#204](https://github.com/labd/commercetools-node-mock/pull/204) [`a4e5a6c`](https://github.com/labd/commercetools-node-mock/commit/a4e5a6c4502e353b607e1fd3c854ef78c52951fc) Thanks [@yugaWicaksono](https://github.com/yugaWicaksono)! - Added missing test to cover OrderSetDeliveryCustomFieldAction in the form of method setDeliveryCustomField inside of OrderUpdateHandler

## 2.28.0

### Minor Changes

- [#202](https://github.com/labd/commercetools-node-mock/pull/202) [`8737a6a`](https://github.com/labd/commercetools-node-mock/commit/8737a6aff198eb26f82ddbc2de32e664bb82e742) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Fixed issues with business units, updated sdk to latest

## 2.27.0

### Minor Changes

- [`2b5dc4c`](https://github.com/labd/commercetools-node-mock/commit/2b5dc4c2acf59b8f38c16073321865a2bcad381f) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Implement customer reset flow for global scope

## 2.26.1

### Patch Changes

- [#194](https://github.com/labd/commercetools-node-mock/pull/194) [`cb84e0a`](https://github.com/labd/commercetools-node-mock/commit/cb84e0a16c3602c770ba906619b13e86d49fa5bd) Thanks [@pvaneveld](https://github.com/pvaneveld)! - Add support for customer set custom type

## 2.26.0

### Minor Changes

- [#191](https://github.com/labd/commercetools-node-mock/pull/191) [`ffcbd97`](https://github.com/labd/commercetools-node-mock/commit/ffcbd97af8921af1c97f616fdb4b474744f73ae8) Thanks [@pvaneveld](https://github.com/pvaneveld)! - add support for customer setLocale action

## 2.25.0

### Minor Changes

- [#190](https://github.com/labd/commercetools-node-mock/pull/190) [`7cce673`](https://github.com/labd/commercetools-node-mock/commit/7cce673e23b76acccd51e2682ffc36c13efa245b) Thanks [@pvaneveld](https://github.com/pvaneveld)! - add support for "setExternalId" customer update action

## 2.24.0

### Minor Changes

- [#188](https://github.com/labd/commercetools-node-mock/pull/188) [`a21f259`](https://github.com/labd/commercetools-node-mock/commit/a21f25920e77842b390384458847f2e909eac35a) Thanks [@pvaneveld](https://github.com/pvaneveld)! - add support for the customer email verify flow

### Patch Changes

- [#186](https://github.com/labd/commercetools-node-mock/pull/186) [`5cdc614`](https://github.com/labd/commercetools-node-mock/commit/5cdc614346d5a69000e0d0cb895531d3a0398a20) Thanks [@mikedebock](https://github.com/mikedebock)! - Fix customObject withContainer postProcessResource arguments

## 2.23.0

### Minor Changes

- [#181](https://github.com/labd/commercetools-node-mock/pull/181) [`934673b`](https://github.com/labd/commercetools-node-mock/commit/934673b89c99f7d447d4f89ecf6a2491464c2644) Thanks [@TiagoUmemura](https://github.com/TiagoUmemura)! - update express version to 4.19.2

### Patch Changes

- [#182](https://github.com/labd/commercetools-node-mock/pull/182) [`f306d61`](https://github.com/labd/commercetools-node-mock/commit/f306d618f9b4b4b6cd4c28bbfa0ccf80a02a618e) Thanks [@jsm1t](https://github.com/jsm1t)! - fixes matching of queries for array objects in predicate parser

- [#183](https://github.com/labd/commercetools-node-mock/pull/183) [`0d0f617`](https://github.com/labd/commercetools-node-mock/commit/0d0f6178210330ddde18907180a9737dd666b78c) Thanks [@jsm1t](https://github.com/jsm1t)! - Fix eslint & prettier errors

## 2.22.1

### Patch Changes

- [#178](https://github.com/labd/commercetools-node-mock/pull/178) [`871e39a`](https://github.com/labd/commercetools-node-mock/commit/871e39afedbabd26d93965436ad87723ca6a1c16) Thanks [@leongraumans](https://github.com/leongraumans)! - Add changeTaxRoundingMode to cart mock

## 2.22.0

### Minor Changes

- [#176](https://github.com/labd/commercetools-node-mock/pull/176) [`0999495`](https://github.com/labd/commercetools-node-mock/commit/09994959ee23d259095eb733fbfdf14e6da7103e) Thanks [@tleguijt](https://github.com/tleguijt)! - Add support for cart setCustomerId and setAnonymousId action

- [#176](https://github.com/labd/commercetools-node-mock/pull/176) [`0999495`](https://github.com/labd/commercetools-node-mock/commit/09994959ee23d259095eb733fbfdf14e6da7103e) Thanks [@tleguijt](https://github.com/tleguijt)! - Include `custom` when creating order from cart

## 2.21.2

### Patch Changes

- [`222fa1c`](https://github.com/labd/commercetools-node-mock/commit/222fa1c983b0e8b04e81ba63133eb5157c523a16) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Handle `var.*` in query endpoints correctly

## 2.21.1

### Patch Changes

- [`3ed13bb`](https://github.com/labd/commercetools-node-mock/commit/3ed13bbb170852c6b2594fd93cd9900c3445237f) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add missing fields to category creation

## 2.21.0

### Minor Changes

- [`7454fda`](https://github.com/labd/commercetools-node-mock/commit/7454fda28162609081cc05a44c9b06c61a5b0776) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve the customer create endpoint

### Patch Changes

- [`5f7dee5`](https://github.com/labd/commercetools-node-mock/commit/5f7dee552e858d565d0812788b5073516b63aabb) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Handle category expand when doing queries

## 2.20.2

### Patch Changes

- [`756c94b`](https://github.com/labd/commercetools-node-mock/commit/756c94b413792dc4512c124562129d95ce10a8d1) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Properly handle expanding ancestors on Category

## 2.20.1

### Patch Changes

- [`08e651b`](https://github.com/labd/commercetools-node-mock/commit/08e651b5d60554b5bd40862b134ece0b11833a91) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Return proper values for Category.ancestors

## 2.20.0

### Minor Changes

- [#169](https://github.com/labd/commercetools-node-mock/pull/169) [`09da22d`](https://github.com/labd/commercetools-node-mock/commit/09da22dd853eda9018b8a2109a1019f4e823cffb) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for customer setCustomerId action

## 2.19.0

### Minor Changes

- [#166](https://github.com/labd/commercetools-node-mock/pull/166) [`851ab0b`](https://github.com/labd/commercetools-node-mock/commit/851ab0bcf61d09e1a375d9d0958b9c2a03035f6c) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for customer setSalutation action

- [#164](https://github.com/labd/commercetools-node-mock/pull/164) [`879a26c`](https://github.com/labd/commercetools-node-mock/commit/879a26c266852ed06a6306f37518c0c16f772d55) Thanks [@stephanbeek](https://github.com/stephanbeek)! - add support for customer setKey action

## 2.18.2

### Patch Changes

- [`8474dda`](https://github.com/labd/commercetools-node-mock/commit/8474ddaea428c93fe96973a102d2f6709e3c14cc) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Use `SetupServerApi` for registerHandler as type

## 2.18.1

### Patch Changes

- [`e9f337a`](https://github.com/labd/commercetools-node-mock/commit/e9f337a4f62c94431993dc8fd52a469742e1625f) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Validate update json body for version and actions

## 2.18.0

### Minor Changes

- [`2c6e829`](https://github.com/labd/commercetools-node-mock/commit/2c6e82912a62ba1ddc6de678e96955c86d02e90c) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Refactor customer password reset flow to better mock commercetools

- [`d801cf3`](https://github.com/labd/commercetools-node-mock/commit/d801cf3b7ccfacb50bea51503445911c00043371) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Show deprecation warnings when start() and stop() are used.

## 2.17.1

### Patch Changes

- [`f101f3b`](https://github.com/labd/commercetools-node-mock/commit/f101f3b974c2b36aad6065fe652c4a6ce1931825) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Return correct type for customer create (CustomerSignInResult)

- [`19df959`](https://github.com/labd/commercetools-node-mock/commit/19df959556216ea7e56e82b8e3ebd39f1b2a84e8) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Format the refresh tokens to match commercetools

## 2.17.0

### Minor Changes

- [#158](https://github.com/labd/commercetools-node-mock/pull/158) [`91c4637`](https://github.com/labd/commercetools-node-mock/commit/91c46376c026246c33bf26bb1c2fa3ef5989aa3a) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for cart setDirectDiscounts action

## 2.16.1

### Patch Changes

- [#156](https://github.com/labd/commercetools-node-mock/pull/156) [`c426209`](https://github.com/labd/commercetools-node-mock/commit/c42620971baba43940c8bd97fd9be677ac48ce80) Thanks [@BramKaashoek](https://github.com/BramKaashoek)! - correctly set productID on ShoppingListLineItem when adding line item by sku

## 2.16.0

### Minor Changes

- [#154](https://github.com/labd/commercetools-node-mock/pull/154) [`282bf59`](https://github.com/labd/commercetools-node-mock/commit/282bf5967a0cac36e97f6a17a11c1e3314962320) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for customer setCustomerNumber action

- [#152](https://github.com/labd/commercetools-node-mock/pull/152) [`7c83048`](https://github.com/labd/commercetools-node-mock/commit/7c8304875c57acd214eb0190808325f14714327a) Thanks [@BramKaashoek](https://github.com/BramKaashoek)! - Adds variant IDs when creating ShoppingListLineItems. Implement Variant expansion on ShoppingListLineItems. Implement ShoppingList update actions.

## 2.15.0

### Minor Changes

- [`c36ccb6`](https://github.com/labd/commercetools-node-mock/commit/c36ccb6da4ad4674cb4d54f73d9cbd7949dc7c2b) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Implement all Payment update actions

## 2.14.2

### Patch Changes

- [#148](https://github.com/labd/commercetools-node-mock/pull/148) [`438fc00`](https://github.com/labd/commercetools-node-mock/commit/438fc009173169d44515b55ac64a5a3bab3eae08) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Fixed /me password not found error response

## 2.14.1

### Patch Changes

- [#145](https://github.com/labd/commercetools-node-mock/pull/145) [`7c2c3ca`](https://github.com/labd/commercetools-node-mock/commit/7c2c3ca2348675a39067d4d5a5f9f47f01efdfe9) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added additional functionality to customer and me/customer

## 2.14.0

### Minor Changes

- [`73efc3d`](https://github.com/labd/commercetools-node-mock/commit/73efc3de72227a6cf65e27ed75cb086c13647ff1) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add various update actions to the Payment API

- [`82a4dc6`](https://github.com/labd/commercetools-node-mock/commit/82a4dc66aa03493d126b1e1a6c3bc15fcedd50c9) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Update all dependencies to their latest version

## 2.13.0

### Minor Changes

- [#143](https://github.com/labd/commercetools-node-mock/pull/143) [`b3dd521`](https://github.com/labd/commercetools-node-mock/commit/b3dd521363fb4ceefdfe721ff4e9e3ddcbb4ed03) Thanks [@mikedebock](https://github.com/mikedebock)! - Add order syncInfo support

## 2.12.2

### Patch Changes

- [`04c9b41`](https://github.com/labd/commercetools-node-mock/commit/04c9b4121f412103f02839bb2189c5dda26a466b) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Read refresh token from body

## 2.12.1

### Patch Changes

- [`ffa83f9`](https://github.com/labd/commercetools-node-mock/commit/ffa83f978c8d2762738f1ab724fda9a318d4eb62) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Expose the authServer publically

## 2.12.0

### Minor Changes

- [`6f0dc45`](https://github.com/labd/commercetools-node-mock/commit/6f0dc4563898dfae87cc60c023437b72e0b1f516) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add support for refresh token flow

## 2.11.0

### Minor Changes

- [`a9f0031`](https://github.com/labd/commercetools-node-mock/commit/a9f00315e3de828f4d4fecc04fd0854510e62ff4) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add ability to create anonymous tokens

## 2.10.0

### Minor Changes

- [#136](https://github.com/labd/commercetools-node-mock/pull/136) [`7927c24`](https://github.com/labd/commercetools-node-mock/commit/7927c24c35e1213755dca65235b70078113e9075) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for cart recalculate action

## 2.9.0

### Minor Changes

- [`bab0609`](https://github.com/labd/commercetools-node-mock/commit/bab060977c0e00f513db63dda1218677754d8f1c) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add cart action to set custom shipping method

- [`31bce78`](https://github.com/labd/commercetools-node-mock/commit/31bce78fd80e1bd8dc39c5181d86b69d6ecd9d67) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve support for custom-objects

- [`768cb56`](https://github.com/labd/commercetools-node-mock/commit/768cb569594d87647d7881ae5f9dd7cd53b9b380) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve mocking of the shipping-methods/matching-cart endpoint

### Patch Changes

- [`abc58e8`](https://github.com/labd/commercetools-node-mock/commit/abc58e836bfbb37137a8369f5b0927c2da0cb31d) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Disable token validation if the validate flag is not set

## 2.8.0

### Minor Changes

- [`361fbef`](https://github.com/labd/commercetools-node-mock/commit/361fbef5983b7f150487cef830f4aed72d059586) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add support for reviews endpoint

- [`16e1237`](https://github.com/labd/commercetools-node-mock/commit/16e12373da7b45c6332ea1549842b8721cef05a2) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add support for returnInfo on orders

- [`61e5729`](https://github.com/labd/commercetools-node-mock/commit/61e5729f2777d066e78328b276507d7e19d2bcad) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add priceSelector logic to product-projections query endpoint

### Patch Changes

- [`dded2b9`](https://github.com/labd/commercetools-node-mock/commit/dded2b9ce4dda72a3057b61151f7852adaab7cd2) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Expose the MSW server via mswServer()

- [`efc6495`](https://github.com/labd/commercetools-node-mock/commit/efc64953ee32c0d1cc3f2b2b97d6b00259b09227) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Upgrade to commercetools sdk 6.0.0

- [`a7d3305`](https://github.com/labd/commercetools-node-mock/commit/a7d3305e3e8428095cf93dcdf9eb78a1599a0059) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Don't overwrite the expanded obj if already set

- [`aa4c63a`](https://github.com/labd/commercetools-node-mock/commit/aa4c63af0770665a2054ac23e591bc76e1af4475) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Keep price channel intact when creating product

## 2.7.0

### Minor Changes

- [`b1370cf`](https://github.com/labd/commercetools-node-mock/commit/b1370cfbb2b43f136a37473fcc1fb41d75e08fe8) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve support for /me endpoint

### Patch Changes

- [`f6f9069`](https://github.com/labd/commercetools-node-mock/commit/f6f90692099a83f8fa755c29fd3b8d0e7dc5f7b8) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Don't clear msw handlers when calling ctMock.clear()

## 2.6.0

### Minor Changes

- [`419a0e1`](https://github.com/labd/commercetools-node-mock/commit/419a0e1556aeb220dd142f8ecc0cbbf01c7bec2a) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve integration options with msw by adding registerHandlers()

## 2.5.0

### Minor Changes

- [#130](https://github.com/labd/commercetools-node-mock/pull/130) [`1197e45`](https://github.com/labd/commercetools-node-mock/commit/1197e457be3255b87c5228c0ba258a98368e112e) Thanks [@mikedebock](https://github.com/mikedebock)! - Add support for HEAD requests

## 2.4.0

### Minor Changes

- [#129](https://github.com/labd/commercetools-node-mock/pull/129) [`92a232f`](https://github.com/labd/commercetools-node-mock/commit/92a232f12cc6ba0ff3cfcc76a1dcecc5f576a172) Thanks [@whyhankee](https://github.com/whyhankee)! - feat(categories): add extra actions

  - changeName
  - changeParent

- [#126](https://github.com/labd/commercetools-node-mock/pull/126) [`a0946b7`](https://github.com/labd/commercetools-node-mock/commit/a0946b710911d3303727ce331a970a30643114fc) Thanks [@TiagoUmemura](https://github.com/TiagoUmemura)! - add support for setAttributeInAllVariants

## 2.3.0

### Minor Changes

- [`4c09caf`](https://github.com/labd/commercetools-node-mock/commit/4c09caf4b76c4c78120171065c4ac1944108593d) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Extended product resource support

## 2.2.0

### Minor Changes

- [`f66d431`](https://github.com/labd/commercetools-node-mock/commit/f66d431882a3044e1d51dcbcff9259573ec3fed6) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Fix Premature close errors by switching from supertest to light-my-request for mapping between msw and express

## 2.1.0

### Minor Changes

- [#120](https://github.com/labd/commercetools-node-mock/pull/120) [`5bf3c6e`](https://github.com/labd/commercetools-node-mock/commit/5bf3c6e88a9903aa45a6341bacb70bf61a20d4b6) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve mocking of customer authentication

## 2.0.0

### Major Changes

- [#108](https://github.com/labd/commercetools-node-mock/pull/108) [`0073abe`](https://github.com/labd/commercetools-node-mock/commit/0073abe1ff75a4bd8b9150cd053b77f0649576ca) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Switch from nock to MSW 2.0 to support native fetch calls. This requires Node 18+

## 1.11.0

### Minor Changes

- [#117](https://github.com/labd/commercetools-node-mock/pull/117) [`a8b52d9`](https://github.com/labd/commercetools-node-mock/commit/a8b52d988ae1b0981dbd75efea5941901e6d204d) Thanks [@mikedebock](https://github.com/mikedebock)! - add support for cart addItemShippingAddress and setLineItemShippingDetails

## 1.10.0

### Minor Changes

- [#115](https://github.com/labd/commercetools-node-mock/pull/115) [`73ef7a2`](https://github.com/labd/commercetools-node-mock/commit/73ef7a2db088b6a0cd7f1e84d8db8d314d9becd0) Thanks [@tleguijt](https://github.com/tleguijt)! - add support for cart removeDiscountCode action

## 1.9.0

### Minor Changes

- [`44822ab`](https://github.com/labd/commercetools-node-mock/commit/44822abb6aeb80cf1a0e8af73b6849e08205e514) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added support for business units

- [`44822ab`](https://github.com/labd/commercetools-node-mock/commit/44822abb6aeb80cf1a0e8af73b6849e08205e514) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added SetCustomType action for CartDiscount

## 1.8.1

### Patch Changes

- [#104](https://github.com/labd/commercetools-node-mock/pull/104) [`4d83b97`](https://github.com/labd/commercetools-node-mock/commit/4d83b97b2fe9e550c87482c0c7c2a052a62b47f7) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Improve mocking of the product projection search

## 1.8.0

### Minor Changes

- [`fef6934`](https://github.com/labd/commercetools-node-mock/commit/fef6934083e1155b060354fe43dd742c2f192b1b) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added changeBuyerAssignable action to associate-role repo

## 1.7.0

### Minor Changes

- [`df59ca9`](https://github.com/labd/commercetools-node-mock/commit/df59ca96acda8d9a6d02a3e98b7dc4a29a89edb2) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added associate role resources

## 1.6.2

### Patch Changes

- [`1396677`](https://github.com/labd/commercetools-node-mock/commit/1396677abbf57f20270b7708a2139e3f4a5a9985) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added category asset actions and cart discount custom fields

## 1.6.1

### Patch Changes

- [`f63d8db`](https://github.com/labd/commercetools-node-mock/commit/f63d8dbdae9dbfdc54131deb431dacae68a18af6) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Fix product projection get by id

## 1.6.0

### Minor Changes

- [#92](https://github.com/labd/commercetools-node-mock/pull/92) [`c53c2b4`](https://github.com/labd/commercetools-node-mock/commit/c53c2b4884f337e276d0d375cb00a2e4f03cbf20) Thanks [@demeyerthom](https://github.com/demeyerthom)! - Added logic for attribute groups

- [#95](https://github.com/labd/commercetools-node-mock/pull/95) [`957864d`](https://github.com/labd/commercetools-node-mock/commit/957864da3ddd35eba66ff3db6abac6b2d11604e3) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Fix implementation of the product projection query endpoint. This also fixes some issues with passing condition values as separate values (var.name)

## 1.5.0

### Minor Changes

- [`9de64b0`](https://github.com/labd/commercetools-node-mock/commit/9de64b098399484fc8b72ceb7a6650f423b96490) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - add setCustomField to customer

### Patch Changes

- [`131ef6c`](https://github.com/labd/commercetools-node-mock/commit/131ef6c76eec3438950c69c5af33a469e3483bfe) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - fix: remove general error from customer

- [`acbba1f`](https://github.com/labd/commercetools-node-mock/commit/acbba1f6e4ad69617784ff313c60874f2f6d7d7d) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - update docker github actions, fix container build

## 1.4.0

### Minor Changes

- [`de55a18`](https://github.com/labd/commercetools-node-mock/commit/de55a1843e26af7f3565d5a77662a9c555bbeb1c) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Move to pure ESM module, we still export the CommonJS module too

### Patch Changes

- [`de55a18`](https://github.com/labd/commercetools-node-mock/commit/de55a1843e26af7f3565d5a77662a9c555bbeb1c) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Vendor both pratt and perplex dependencies to make them work with ESM

## 1.3.2

### Patch Changes

- [`9c01157`](https://github.com/labd/commercetools-node-mock/commit/9c011574d42512bd793030161bf9a336ebe4e2cb) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Attempt to fix perplex constructor error

## 1.3.1

### Patch Changes

- [`7528ac2`](https://github.com/labd/commercetools-node-mock/commit/7528ac24884f5a213274ba9c677b6ad62f2e518a) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Fix error related to perplex when used from ESM

## 1.3.0

### Minor Changes

- [`0f4cbbf`](https://github.com/labd/commercetools-node-mock/commit/0f4cbbf17de903a13b73df3c1281923c8c48281d) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Remove peerDependency for @commercetools/platform-sdk and make sure we only import types

- [`0f4cbbf`](https://github.com/labd/commercetools-node-mock/commit/0f4cbbf17de903a13b73df3c1281923c8c48281d) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Add support for Cart.changeLineItemQuantity

- [`0f4cbbf`](https://github.com/labd/commercetools-node-mock/commit/0f4cbbf17de903a13b73df3c1281923c8c48281d) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Update most dependencies to latest version

### Patch Changes

- [`0f4cbbf`](https://github.com/labd/commercetools-node-mock/commit/0f4cbbf17de903a13b73df3c1281923c8c48281d) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Switch to using vitest instead of jest

## 1.2.0

### Minor Changes

- [`612de44`](https://github.com/labd/commercetools-node-mock/commit/612de441beb35bb75af55889cba2065d61bf27c4) Thanks [@davidweterings](https://github.com/davidweterings)! - Add shipping method localized name action

## 1.1.3

### Patch Changes

- [`c0d5850`](https://github.com/labd/commercetools-node-mock/commit/c0d5850518fa403034e3028ee82b118fabeb3807) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Move from lodash to lodash.isequal

## 1.1.2

### Patch Changes

- [#74](https://github.com/labd/commercetools-node-mock/pull/74) [`b521a4a`](https://github.com/labd/commercetools-node-mock/commit/b521a4a6dc42c1e97c61f0a6683ea7fe21636ddd) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - fix: use tsup onSuccess instead of nodemon

## 1.1.1

### Patch Changes

- [#72](https://github.com/labd/commercetools-node-mock/pull/72) [`d6b123b`](https://github.com/labd/commercetools-node-mock/commit/d6b123bdc6dfbccb3b4dc0b0791abdeb7a99bbea) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - fix: revert start script to old situation, running server

## 1.1.0

### Minor Changes

- [#70](https://github.com/labd/commercetools-node-mock/pull/70) [`2776347`](https://github.com/labd/commercetools-node-mock/commit/2776347c752c4682314f9b0cef6f6ae27b972d50) Thanks [@mikedebock](https://github.com/mikedebock)! -

  - Add addPrice product update action
  - Add changePrice product update action
  - Add removePrice product update action

## 1.0.0

### Major Changes

- [#68](https://github.com/labd/commercetools-node-mock/pull/68) [`7b74869`](https://github.com/labd/commercetools-node-mock/commit/7b74869689692b815e632a413b7a51d22fc76ed1) Thanks [@okkevandereijk](https://github.com/okkevandereijk)! - :warning: This is a major update dropping support for Node 14 and under.

  - Updated node to version 18
  - Updated pnpm to version 8
  - Enforce eslint with default library

## 0.14.1

### Patch Changes

- [`fc0f786`](https://github.com/labd/commercetools-node-mock/commit/fc0f78645c687a3ac103db1ee822b5c93a0ecb11) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Fix release process to build before publishing to npm

### Minor Changes

- [#62](https://github.com/labd/commercetools-node-mock/pull/62) [`d81b817`](https://github.com/labd/commercetools-node-mock/commit/d81b81780dd03c33596c0a4ab6bbf1b19b91484a) Thanks [@bala-goflink](https://github.com/bala-goflink)! - Add support for standalone-prices

## 0.13.0

### Minor Changes

- [`600a470`](https://github.com/labd/commercetools-node-mock/commit/600a470cbb8c89eef78e19f63efbe9a2fc17ebd8) Thanks [@mvantellingen](https://github.com/mvantellingen)! - Switch to using @changesets for releases

## 0.11.1 (2023-03-01)

- Store deleteDaysAfterCreation on project settings
- Add addExternalImage and removeImage product update actions

## 0.10.1 (2022-10-13)

- Various fixes to the internal type system

## 0.10.0 (2022-10-10)

- Implement update by key and delete by key support for all resources
- Added support for updating `authenticationMode` of a customer
- Improve handling of staged vs current product data for products
- Improve version identifier increments to match commercetools
- Refactor product projection to handle published vs non published products

## 0.9.1 (2022-09-08)

- Added boolean parsing logic for predicates.

## 0.9.0 (2022-08-23)

- Include `key`, `description` and `metaDescription` when converting product to product projection
- Add support for updating transitions in state
- Set fractionDigits for money based on currency code
- Improve logic to mask secret values in resources

## 0.8.0 (2022-07-27)

- Implement experimental support for facets in the product projection search.

## 0.7.2 (2022-07-26)

- Add support for multiple RANGE() clauses in the product projection endpoint.

## 0.7.1 (2022-07-25)

- Fix a packaging error in the GitHub workflow. The artifact for version 0.7.0 didn't contain the bundled output files.

## 0.7.0 (2022-07-25)

- Rewrite the mock implementation of the product projection search endpoint to work with products created via the product endpoint. This also adds support for multiple filters.
- Replace tsdx with tsup for building the library
- Drop support for Node 12 and add Node 18.
