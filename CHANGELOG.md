
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
