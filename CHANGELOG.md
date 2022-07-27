0.8.0 (27-07-2022)
==================
- Implement experimental support for facets in the product projection search.

0.7.2 (26-07-2022)
==================
 - Add support for multiple RANGE() clauses in the product projection endpoint.

0.7.1 (25-07-2022)
==================
 - Fix a packaging error in the GitHub workflow. The artifact for version 0.7.0 didn't contain the bundled output files.


0.7.0 (25-07-2022)
==================
 - Rewrite the mock implementation of the product projection search endpoint to work with products created via the product endpoint. This also adds support for multiple filters.
 - Replace tsdx with tsup for building the library
 - Drop support for Node 12 and add Node 18.
