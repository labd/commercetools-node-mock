import type { BaseAddress } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { InMemoryStorage } from "#src/storage/index.ts";
import { createAddress } from "./helpers.ts";

describe("Helpers", () => {
    const storage = new InMemoryStorage();
    const projectKey = "test-project";

    describe("createAddress", () => {

        test("should generate random id when id is not provided", () => {
            const baseAddress: BaseAddress = {
                country: "US",
                streetName: "Test Street",
                city: "Test City",
            };

            const result = createAddress(baseAddress, projectKey, storage);
            expect(result).toBeDefined();
            expect(result?.id).toBeDefined();
            expect(typeof result?.id).toBe("string");
            expect(result?.id).toMatch(/^[a-z0-9]{8}$/);
        });


    });
});
