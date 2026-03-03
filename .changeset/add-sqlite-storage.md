---
"@labdigital/commercetools-mock": minor
---

Add `SQLiteStorage` backend using Node.js built-in `node:sqlite` module (available since v22.5.0). This provides a persistent storage option that stores data in a SQLite database file while maintaining full compatibility with the existing in-memory backend.

### Usage

```typescript
import { CommercetoolsMock, SQLiteStorage } from "@labdigital/commercetools-mock";

// File-based persistent storage
const storage = new SQLiteStorage({ filename: "my-mock.db" });
const ctMock = new CommercetoolsMock({ storage });

// In-memory SQLite (useful for tests)
const storage = new SQLiteStorage({ filename: ":memory:" });
```

### New exports

- `SQLiteStorage` — SQLite-backed storage implementation with `close()` method for cleanup
