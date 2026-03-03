---
"@labdigital/commercetools-mock": minor
---

Add `SQLiteStorage` backend using Node.js built-in `node:sqlite` module (available since v22.5.0). This provides a persistent storage option that stores data in a SQLite database file while maintaining full compatibility with the existing in-memory backend.

`SQLiteStorage` is available as a separate entry point to avoid breaking compatibility with Node.js < 22.5.0:

### Usage

```typescript
import { CommercetoolsMock } from "@labdigital/commercetools-mock";
import { SQLiteStorage } from "@labdigital/commercetools-mock/sqlite";

// File-based persistent storage
const storage = new SQLiteStorage({ filename: "my-mock.db" });
const ctMock = new CommercetoolsMock({ storage });

// In-memory SQLite (useful for tests)
const storage = new SQLiteStorage({ filename: ":memory:" });
```

### New exports

- `@labdigital/commercetools-mock/sqlite` — Separate entry point exporting `SQLiteStorage` and `SQLiteStorageOptions`
