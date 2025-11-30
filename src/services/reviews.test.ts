import type { Product, Review, State } from "@commercetools/platform-sdk";
import supertest from "supertest";
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
		const productResponse = await supertest(ctMock.app)
			.post("/dummy/products")
			.send({
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
			});
		expect(productResponse.status).toBe(201);
		product = productResponse.body;

		// Create a state
		const stateResponse = await supertest(ctMock.app)
			.post("/dummy/states")
			.send({
				key: "review-state",
				type: "ReviewState",
				name: { en: "Review State" },
				initial: true,
			});
		expect(stateResponse.status).toBe(201);
		state = stateResponse.body;

		// Create a review
		const reviewResponse = await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				key: "test-review",
				authorName: "John Doe",
				title: "Great product!",
				text: "I really love this product.",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			});
		expect(reviewResponse.status).toBe(201);
		review = reviewResponse.body;
	});

	test("setAuthorName", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAuthorName",
						authorName: "Jane Smith",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.authorName).toBe("Jane Smith");
		expect(response.body.version).toBe(2);
	});

	test("setTitle", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setTitle",
						title: "Amazing product!",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.title).toBe("Amazing product!");
		expect(response.body.version).toBe(2);
	});

	test("setText", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setText",
						text: "This product exceeded my expectations!",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.text).toBe("This product exceeded my expectations!");
		expect(response.body.version).toBe(2);
	});

	test("setRating", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setRating",
						rating: 4,
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.rating).toBe(4);
		expect(response.body.version).toBe(2);
	});

	test("setLocale", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setLocale",
						locale: "de-DE",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.locale).toBe("de-DE");
		expect(response.body.version).toBe(2);
	});

	test("setKey", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setKey",
						key: "updated-review-key",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.key).toBe("updated-review-key");
		expect(response.body.version).toBe(2);
	});

	test("transitionState", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
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
			});

		expect(response.status).toBe(200);
		expect(response.body.state).toMatchObject({
			typeId: "state",
			id: state.id,
		});
		expect(response.body.version).toBe(2);
	});

	test("multiple actions in one update", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/reviews/${review.id}`)
			.send({
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
			});

		expect(response.status).toBe(200);
		expect(response.body.authorName).toBe("Updated Author");
		expect(response.body.rating).toBe(3);
		expect(response.body.text).toBe("Updated review text");
		// Version should be incremented by 3 since each action modifies the resource
		expect(response.body.version).toBe(4);
	});
});
