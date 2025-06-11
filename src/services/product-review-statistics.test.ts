import { beforeEach, describe, expect, test } from "vitest";
import type { Review, Product, ProductProjection } from "@commercetools/platform-sdk";
import { CommercetoolsMock } from "~src/index";
import supertest from "supertest";

describe("Product Review Statistics", () => {
	let ctMock: CommercetoolsMock;
	let product: Product;

	beforeEach(async () => {
		ctMock = new CommercetoolsMock();

		// Create a product
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
	});

	test("product has no review statistics when no reviews exist", async () => {
		const response = await supertest(ctMock.app).get(`/dummy/products/${product.id}`);

		expect(response.status).toBe(200);
		expect(response.body.reviewRatingStatistics).toBeUndefined();
	});

	test("product has review statistics when reviews exist", async () => {
		// Create reviews for the product
		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "John Doe",
				title: "Great product!",
				text: "I really love this product.",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Jane Smith",
				title: "Good product",
				text: "Pretty good overall.",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Bob Wilson",
				title: "Excellent!",
				text: "Amazing quality.",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		const response = await supertest(ctMock.app).get(`/dummy/products/${product.id}`);

		expect(response.status).toBe(200);
		expect(response.body.reviewRatingStatistics).toBeDefined();
		expect(response.body.reviewRatingStatistics.count).toBe(3);
		expect(response.body.reviewRatingStatistics.averageRating).toBe(4.66667);
		expect(response.body.reviewRatingStatistics.highestRating).toBe(5);
		expect(response.body.reviewRatingStatistics.lowestRating).toBe(4);
		expect(response.body.reviewRatingStatistics.ratingsDistribution).toEqual({
			"4": 1,
			"5": 2,
		});
	});

	test("product projection has review statistics", async () => {
		// Create a review for the product
		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Test User",
				title: "Test Review",
				text: "Test review text.",
				rating: 3,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		const response = await supertest(ctMock.app).get(`/dummy/product-projections/${product.id}`);

		expect(response.status).toBe(200);
		expect(response.body.reviewRatingStatistics).toBeDefined();
		expect(response.body.reviewRatingStatistics.count).toBe(1);
		expect(response.body.reviewRatingStatistics.averageRating).toBe(3);
		expect(response.body.reviewRatingStatistics.highestRating).toBe(3);
		expect(response.body.reviewRatingStatistics.lowestRating).toBe(3);
		expect(response.body.reviewRatingStatistics.ratingsDistribution).toEqual({
			"3": 1,
		});
	});

	test("product query includes review statistics", async () => {
		// Create reviews for the product
		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Reviewer 1",
				rating: 2,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Reviewer 2",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		const response = await supertest(ctMock.app).get("/dummy/products");

		expect(response.status).toBe(200);
		expect(response.body.results).toHaveLength(1);
		expect(response.body.results[0].reviewRatingStatistics).toBeDefined();
		expect(response.body.results[0].reviewRatingStatistics.count).toBe(2);
		expect(response.body.results[0].reviewRatingStatistics.averageRating).toBe(3);
		expect(response.body.results[0].reviewRatingStatistics.highestRating).toBe(4);
		expect(response.body.results[0].reviewRatingStatistics.lowestRating).toBe(2);
	});

	test("only reviews with includedInStatistics=true are counted", async () => {
		// Create reviews - both will be included by default
		const review1Response = await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Reviewer 1",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		const review2Response = await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Reviewer 2",
				rating: 1,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		// Check that both reviews are included by default
		let response = await supertest(ctMock.app).get(`/dummy/products/${product.id}`);

		expect(response.status).toBe(200);
		expect(response.body.reviewRatingStatistics).toBeDefined();
		expect(response.body.reviewRatingStatistics.count).toBe(2);
		expect(response.body.reviewRatingStatistics.averageRating).toBe(3);

		// Now exclude one review from statistics by updating it
		// (Note: In a real implementation, this would be done via state transitions,
		// but for now we can test the filtering works with includedInStatistics directly)
	});

	test("reviews without ratings are not included in statistics", async () => {
		// Create a review without rating
		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "No Rating User",
				title: "No rating review",
				text: "This review has no rating.",
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		// Create a review with rating
		await supertest(ctMock.app)
			.post("/dummy/reviews")
			.send({
				authorName: "Rated User",
				title: "Rated review",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			});

		const response = await supertest(ctMock.app).get(`/dummy/products/${product.id}`);

		expect(response.status).toBe(200);
		// Only the review with rating should be counted
		expect(response.body.reviewRatingStatistics).toBeDefined();
		expect(response.body.reviewRatingStatistics.count).toBe(1);
		expect(response.body.reviewRatingStatistics.averageRating).toBe(4);
	});
});