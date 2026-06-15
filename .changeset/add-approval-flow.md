---
"@labdigital/commercetools-mock": minor
---

Add support for `ApprovalFlow`. Exposes the `as-associate` approval-flows routes (list, get by id, update with `approve`/`reject`/`setCustomField`/`setCustomType` actions) and a synthetic top-level `/{projectKey}/approval-flows` POST endpoint with an `approvalFlowDraftFactory` so test fixtures can seed approval flows directly.
