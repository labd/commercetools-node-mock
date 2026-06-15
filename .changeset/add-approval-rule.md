---
"@labdigital/commercetools-mock": minor
---

Add support for `ApprovalRule`. Exposes the `as-associate` approval-rules routes (list, create, get/update by id and by key) with full update-action handling (`setApprovers`, `setRequesters`, `setName`, `setDescription`, `setKey`, `setPredicate`, `setStatus`, `setCustomField`, `setCustomType`). Adds a synthetic top-level `/{projectKey}/approval-rules` endpoint and an `approvalRuleDraftFactory` for test fixtures. Also renames the as-associate route param `:businessUnitId` to `:businessUnitKey` to match the value it actually captures.
