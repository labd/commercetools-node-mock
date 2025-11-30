import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { createRepositories } from "./index.ts";

describe("Repository Index", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };

	test("createRepositories succeeds", () => {
		const repositories = createRepositories(config);

		// Test that createRepositories succeeded
		expect(repositories).toBeDefined();
		expect(typeof repositories).toBe("object");
	});
});
