# 0.9.2 (unreleased)
- Added support for updating `authenticationMode` of a customer

# 0.9.1 (08-09-2022)

- Added boolean parsing logic for predicates.

# 0.9.0 (23-08-2022)

- Include `key`, `description` and `metaDescription` when converting product to product projection
- Add support for updating transitions in state
- Set fractionDigits for money based on currency code
- Improve logic to mask secret values in resources

# 0.8.0 (27-07-2022)

- Implement experimental support for facets in the product projection search.

# 0.7.2 (26-07-2022)

- Add support for multiple RANGE() clauses in the product projection endpoint.

# 0.7.1 (25-07-2022)

- Fix a packaging error in the GitHub workflow. The artifact for version 0.7.0 didn't contain the bundled output files.

# 0.7.0 (25-07-2022)

- Rewrite the mock implementation of the product projection search endpoint to work with products created via the product endpoint. This also adds support for multiple filters.
- Replace tsdx with tsup for building the library
- Drop support for Node 12 and add Node 18.
