## 1.11.0

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
