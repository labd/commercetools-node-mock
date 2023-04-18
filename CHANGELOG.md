## 0.14.0

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
