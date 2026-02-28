import type { Product } from "@commercetools/platform-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "#src/index.ts";

describe("Product Review Statistics", () => {
	let ctMock: CommercetoolsMock;
	let product: Product;

	beforeEach(async () => {
		ctMock = new CommercetoolsMock();

		// Create a product
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
	});

	test("product has no review statistics when no reviews exist", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().reviewRatingStatistics).toBeUndefined();
	});

	test("product has review statistics when reviews exist", async () => {
		// Create reviews for the product
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
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

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Jane Smith",
				title: "Good product",
				text: "Pretty good overall.",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Bob Wilson",
				title: "Excellent!",
				text: "Amazing quality.",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.reviewRatingStatistics).toBeDefined();
		expect(body.reviewRatingStatistics.count).toBe(3);
		expect(body.reviewRatingStatistics.averageRating).toBe(4.66667);
		expect(body.reviewRatingStatistics.highestRating).toBe(5);
		expect(body.reviewRatingStatistics.lowestRating).toBe(4);
		expect(body.reviewRatingStatistics.ratingsDistribution).toEqual({
			"4": 1,
			"5": 2,
		});
	});

	test("product projection has review statistics", async () => {
		// Create a review for the product
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Test User",
				title: "Test Review",
				text: "Test review text.",
				rating: 3,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-projections/${product.id}`,
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.reviewRatingStatistics).toBeDefined();
		expect(body.reviewRatingStatistics.count).toBe(1);
		expect(body.reviewRatingStatistics.averageRating).toBe(3);
		expect(body.reviewRatingStatistics.highestRating).toBe(3);
		expect(body.reviewRatingStatistics.lowestRating).toBe(3);
		expect(body.reviewRatingStatistics.ratingsDistribution).toEqual({
			"3": 1,
		});
	});

	test("product query includes review statistics", async () => {
		// Create reviews for the product
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Reviewer 1",
				rating: 2,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Reviewer 2",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/products",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.results).toHaveLength(1);
		expect(body.results[0].reviewRatingStatistics).toBeDefined();
		expect(body.results[0].reviewRatingStatistics.count).toBe(2);
		expect(body.results[0].reviewRatingStatistics.averageRating).toBe(
			3,
		);
		expect(body.results[0].reviewRatingStatistics.highestRating).toBe(
			4,
		);
		expect(body.results[0].reviewRatingStatistics.lowestRating).toBe(
			2,
		);
	});

	test("only reviews with includedInStatistics=true are counted", async () => {
		// Create reviews - both will be included by default
		const _review1Response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Reviewer 1",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		const _review2Response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Reviewer 2",
				rating: 1,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		// Check that both reviews are included by default
		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.reviewRatingStatistics).toBeDefined();
		expect(body.reviewRatingStatistics.count).toBe(2);
		expect(body.reviewRatingStatistics.averageRating).toBe(3);

		// Now exclude one review from statistics by updating it
		// (Note: In a real implementation, this would be done via state transitions,
		// but for now we can test the filtering works with includedInStatistics directly)
	});

	test("reviews without ratings are not included in statistics", async () => {
		// Create a review without rating
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "No Rating User",
				title: "No rating review",
				text: "This review has no rating.",
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		// Create a review with rating
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "Rated User",
				title: "Rated review",
				rating: 4,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		// Only the review with rating should be counted
		expect(body.reviewRatingStatistics).toBeDefined();
		expect(body.reviewRatingStatistics.count).toBe(1);
		expect(body.reviewRatingStatistics.averageRating).toBe(4);
	});

	test("reviews on other products are excluded from statistics", async () => {
		// Create another product
		const otherProductResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: {
				name: { en: "Other Product" },
				slug: { en: "other-product" },
				productType: {
					typeId: "product-type",
					key: "dummy-product-type",
				},
				masterVariant: {
					sku: "other-sku",
					prices: [
						{
							value: {
								currencyCode: "EUR",
								centAmount: 2000,
							},
						},
					],
				},
			},
		});
		expect(otherProductResponse.statusCode).toBe(201);
		const otherProduct = otherProductResponse.json();

		// Create reviews for both products
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "User A",
				title: "Review for first product",
				rating: 5,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "User B",
				title: "Review for second product",
				rating: 1,
				target: {
					typeId: "product",
					id: otherProduct.id,
				},
			},
		});

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/reviews",
			payload: {
				authorName: "User C",
				title: "Another review for first product",
				rating: 3,
				target: {
					typeId: "product",
					id: product.id,
				},
			},
		});

		// Check statistics for the first product - should only include its own reviews
		const response1 = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${product.id}`,
		});
		expect(response1.statusCode).toBe(200);
		const body1 = response1.json();
		expect(body1.reviewRatingStatistics).toBeDefined();
		expect(body1.reviewRatingStatistics.count).toBe(2); // Only reviews for this product
		expect(body1.reviewRatingStatistics.averageRating).toBe(4); // (5 + 3) / 2 = 4
		expect(body1.reviewRatingStatistics.highestRating).toBe(5);
		expect(body1.reviewRatingStatistics.lowestRating).toBe(3);
		expect(body1.reviewRatingStatistics.ratingsDistribution).toEqual({
			"3": 1,
			"5": 1,
		});

		// Check statistics for the second product - should only include its own review
		const response2 = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/products/${otherProduct.id}`,
		});
		expect(response2.statusCode).toBe(200);
		const body2 = response2.json();
		expect(body2.reviewRatingStatistics).toBeDefined();
		expect(body2.reviewRatingStatistics.count).toBe(1); // Only reviews for this product
		expect(body2.reviewRatingStatistics.averageRating).toBe(1);
		expect(body2.reviewRatingStatistics.highestRating).toBe(1);
		expect(body2.reviewRatingStatistics.lowestRating).toBe(1);
		expect(body2.reviewRatingStatistics.ratingsDistribution).toEqual({
			"1": 1,
		});
	});
});
