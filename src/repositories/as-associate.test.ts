import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
} from "./as-associate";
import { CustomerRepository } from "./customer";

describe("As Associate Repositories", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };

	test("AsAssociateCartRepository extends CartRepository", () => {
		const repository = new AsAssociateCartRepository(config);

		// Check that it has the expected methods from CartRepository
		expect(repository).toHaveProperty("create");
		expect(repository).toHaveProperty("query");
		expect(repository).toHaveProperty("get");
		expect(repository).toHaveProperty("getByKey");
		expect(repository).toHaveProperty("delete");
		expect(repository).toHaveProperty("processUpdateActions");

		// Check that it's properly instantiated
		expect(repository).toBeDefined();
	});

	test("AsAssociateOrderRepository extends OrderRepository", () => {
		const repository = new AsAssociateOrderRepository(config);

		// Check that it has the expected methods from OrderRepository
		expect(repository).toHaveProperty("create");
		expect(repository).toHaveProperty("query");
		expect(repository).toHaveProperty("get");
		expect(repository).toHaveProperty("getByKey");
		expect(repository).toHaveProperty("delete");
		expect(repository).toHaveProperty("processUpdateActions");

		// Check that it's properly instantiated
		expect(repository).toBeDefined();
	});

	test("AsAssociateQuoteRequestRepository extends QuoteRequestRepository", () => {
		const repository = new AsAssociateQuoteRequestRepository(config);

		// Check that it has the expected methods from QuoteRequestRepository
		expect(repository).toHaveProperty("create");
		expect(repository).toHaveProperty("query");
		expect(repository).toHaveProperty("get");
		expect(repository).toHaveProperty("getByKey");
		expect(repository).toHaveProperty("delete");
		expect(repository).toHaveProperty("processUpdateActions");

		// Check that it's properly instantiated
		expect(repository).toBeDefined();
	});

	test("AsAssociateCartRepository can create and retrieve carts", () => {
		const repository = new AsAssociateCartRepository(config);
		const ctx = { projectKey: "test-project" };

		const cartDraft = {
			currency: "EUR",
			inventoryMode: "None" as const,
			taxMode: "Platform" as const,
			taxRoundingMode: "HalfEven" as const,
			taxCalculationMode: "UnitPriceLevel" as const,
		};

		const cart = repository.create(ctx, cartDraft);
		expect(cart.id).toBeDefined();
		expect(cart.version).toBe(1);
		expect(cart.totalPrice.currencyCode).toBe("EUR");

		// Test query
		const result = repository.query(ctx);
		expect(result.count).toBe(1);
		expect(result.results[0].id).toBe(cart.id);

		// Test get
		const retrieved = repository.get(ctx, cart.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(cart.id);
	});

	test("AsAssociateOrderRepository can create and retrieve orders", () => {
		const repository = new AsAssociateOrderRepository(config);
		const ctx = { projectKey: "test-project" };

		// First create a cart to create an order from
		const cartRepository = new AsAssociateCartRepository(config);
		const cartDraft = {
			currency: "EUR",
			inventoryMode: "None" as const,
			taxMode: "Platform" as const,
			taxRoundingMode: "HalfEven" as const,
			taxCalculationMode: "UnitPriceLevel" as const,
		};
		const cart = cartRepository.create(ctx, cartDraft);

		const orderDraft = {
			cart: {
				id: cart.id,
				typeId: "cart" as const,
			},
			version: cart.version,
		};

		const order = repository.create(ctx, orderDraft);
		expect(order.id).toBeDefined();
		expect(order.version).toBe(1);
		expect(order.cart?.id).toBe(cart.id);

		// Test query
		const result = repository.query(ctx);
		expect(result.count).toBe(1);
		expect(result.results[0].id).toBe(order.id);

		// Test get
		const retrieved = repository.get(ctx, order.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(order.id);
	});

	test("AsAssociateQuoteRequestRepository can create and retrieve quote requests", () => {
		const repository = new AsAssociateQuoteRequestRepository(config);
		const ctx = { projectKey: "test-project" };

		// Create a customer using the customer repository
		const customerRepository = new CustomerRepository(config);
		const customer = customerRepository.create(ctx, {
			email: "test@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});

		// First create a cart to create a quote request from
		const cartRepository = new AsAssociateCartRepository(config);
		const cartDraft = {
			currency: "EUR",
			customerId: customer.id,
		};
		const cart = cartRepository.create(ctx, cartDraft);

		const quoteRequestDraft = {
			cart: {
				id: cart.id,
				typeId: "cart" as const,
			},
			cartVersion: cart.version,
		};

		const quoteRequest = repository.create(ctx, quoteRequestDraft);
		expect(quoteRequest.id).toBeDefined();
		expect(quoteRequest.version).toBe(1);
		expect(quoteRequest.cart?.id).toBe(cart.id);

		// Test query
		const result = repository.query(ctx);
		expect(result.count).toBe(1);
		expect(result.results[0].id).toBe(quoteRequest.id);

		// Test get
		const retrieved = repository.get(ctx, quoteRequest.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(quoteRequest.id);
	});
});
