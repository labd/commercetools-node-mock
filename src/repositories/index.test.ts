import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { createRepositories } from "./index";

describe("Repository Index", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };

	test("createRepositories returns all expected repositories", () => {
		const repositories = createRepositories(config);

		// Test that all expected repositories are created
		expect(repositories).toHaveProperty("as-associate");
		expect(repositories["as-associate"]).toHaveProperty("cart");
		expect(repositories["as-associate"]).toHaveProperty("order");
		expect(repositories["as-associate"]).toHaveProperty("quote-request");

		expect(repositories).toHaveProperty("associate-role");
		expect(repositories).toHaveProperty("attribute-group");
		expect(repositories).toHaveProperty("business-unit");
		expect(repositories).toHaveProperty("category");
		expect(repositories).toHaveProperty("cart");
		expect(repositories).toHaveProperty("cart-discount");
		expect(repositories).toHaveProperty("customer");
		expect(repositories).toHaveProperty("channel");
		expect(repositories).toHaveProperty("customer-group");
		expect(repositories).toHaveProperty("discount-code");
		expect(repositories).toHaveProperty("extension");
		expect(repositories).toHaveProperty("inventory-entry");
		expect(repositories).toHaveProperty("key-value-document");
		expect(repositories).toHaveProperty("order");
		expect(repositories).toHaveProperty("order-edit");
		expect(repositories).toHaveProperty("payment");
		expect(repositories).toHaveProperty("my-cart");
		expect(repositories).toHaveProperty("my-order");
		expect(repositories).toHaveProperty("my-customer");
		expect(repositories).toHaveProperty("my-payment");
		expect(repositories).toHaveProperty("my-shopping-list");
		expect(repositories).toHaveProperty("product");
		expect(repositories).toHaveProperty("product-type");
		expect(repositories).toHaveProperty("product-discount");
		expect(repositories).toHaveProperty("product-projection");
		expect(repositories).toHaveProperty("product-selection");
		expect(repositories).toHaveProperty("product-tailoring");
		expect(repositories).toHaveProperty("project");
		expect(repositories).toHaveProperty("review");
		expect(repositories).toHaveProperty("quote");
		expect(repositories).toHaveProperty("quote-request");
		expect(repositories).toHaveProperty("shipping-method");
		expect(repositories).toHaveProperty("shopping-list");
		expect(repositories).toHaveProperty("staged-quote");
		expect(repositories).toHaveProperty("standalone-price");
		expect(repositories).toHaveProperty("state");
		expect(repositories).toHaveProperty("store");
		expect(repositories).toHaveProperty("subscription");
		expect(repositories).toHaveProperty("tax-category");
		expect(repositories).toHaveProperty("type");
		expect(repositories).toHaveProperty("zone");
	});

	test("repositories are properly instantiated", () => {
		const repositories = createRepositories(config);

		// Test that repositories have expected methods
		expect(repositories.cart).toHaveProperty("create");
		expect(repositories.cart).toHaveProperty("query");
		expect(repositories.cart).toHaveProperty("get");
		expect(repositories.cart).toHaveProperty("getByKey");
		expect(repositories.cart).toHaveProperty("delete");

		expect(repositories.customer).toHaveProperty("create");
		expect(repositories.customer).toHaveProperty("query");
		expect(repositories.customer).toHaveProperty("get");
		expect(repositories.customer).toHaveProperty("getByKey");
		expect(repositories.customer).toHaveProperty("delete");
	});
});
