## 1.11.0

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
