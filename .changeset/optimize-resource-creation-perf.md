---
"@labdigital/commercetools-mock": patch
---

Improve resource creation performance, especially noticeable with SQLite storage and large numbers of resources:

- Eliminate redundant re-fetch after inserting a resource in both SQLite and InMemory storage backends
- Cache known project keys in SQLite storage to skip repeated INSERT+SELECT on the projects table
- Avoid double-fetching the resource in the service POST handler by reusing the already-created resource instead of re-fetching from storage
