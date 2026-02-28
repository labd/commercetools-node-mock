import type { Product, Review, State } from "@commercetools/platform-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "#src/index.ts";

describe("Review Update Actions", () => {
	let ctMock: CommercetoolsMock;
	let review: Review;
	let product: Product;
	let state: State;

	beforeEach(async () => {
		ctMock = new CommercetoolsMock();

		// Create a product to target
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: {
				name: { en: "Test Product" },
				slug: { en: "test-product" },
				productType: {
					typeId: "product-type",
					key: "dummy-product-type",
				},
				masterVariant: {
					sku: "test-sku-1",
					prices: [
						{
							value: {
								currencyCode: "EUR",
								centAmount: 1000,
							},
						},
					],
				},
			},
		});
		expect(productResponse.statusCode).toBe(201);
		product = productResponse.json();

		// Create a state
		const stateResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/states",
			payload: {
				key: "review-state",
				type: "ReviewState",
				name: { en: "Review State" },
				initial: true,
			},
		});
		expect(stateResponse.statusCode).toBe(201);
		state = stateResponse.json();

		// Create a review
		const reviewResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				key: "test-review",
				authorName: "John Doe",
				title: "Great product!",
				text: "I really love this product.",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});
		expect(reviewResponse.statusCode).toBe(201);
		review = reviewResponse.json();
	});

	test("setAuthorName", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setAuthorName",
						authorName: "Jane Smith",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().authorName).toBe("Jane Smith");
		expect(response.json().version).toBe(2);
	});

	test("setTitle", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setTitle",
						title: "Amazing product!",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().title).toBe("Amazing product!");
		expect(response.json().version).toBe(2);
	});

	test("setText", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setText",
						text: "This product exceeded my expectations!",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().text).toBe("This product exceeded my expectations!");
		expect(response.json().version).toBe(2);
	});

	test("setRating", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setRating",
						rating: 4,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().rating).toBe(4);
		expect(response.json().version).toBe(2);
	});

	test("setLocale", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setLocale",
						locale: "de-DE",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().locale).toBe("de-DE");
		expect(response.json().version).toBe(2);
	});

	test("setKey", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setKey",
						key: "updated-review-key",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().key).toBe("updated-review-key");
		expect(response.json().version).toBe(2);
	});

	test("transitionState", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "transitionState",
						state: {
							typeId: "state",
							id: state.id,
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().state).toMatchObject({
			typeId: "state",
			id: state.id,
		});
		expect(response.json().version).toBe(2);
	});

	test("multiple actions in one update", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/reviews/${review.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setAuthorName",
						authorName: "Updated Author",
					},
					{
						action: "setRating",
						rating: 3,
					},
					{
						action: "setText",
						text: "Updated review text",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.authorName).toBe("Updated Author");
		expect(body.rating).toBe(3);
		expect(body.text).toBe("Updated review text");
		// Version should be incremented by 3 since each action modifies the resource
		expect(body.version).toBe(4);
	});
});
