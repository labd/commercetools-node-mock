import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

const get = (url: string) => ctMock.app.inject({ method: "GET", url });

/**
 * commercetools documents in-store endpoints for a subset of resources only.
 * Everything else under /{projectKey}/in-store/key={storeKey} is a 404 on the
 * real API, so the mock must not accept it either.
 */
describe("in-store routes", () => {
	test.each([
		"business-units",
		"cart-discounts",
		"carts",
		"customers",
		"discount-codes",
		"me/carts",
		"orders",
		"product-projections",
		"quote-requests",
		"quotes",
		"shopping-lists",
		"staged-quotes",
	])("serves /in-store/key=:storeKey/%s", async (path) => {
		const response = await get(`/dummy/in-store/key=my-store/${path}`);
		expect(response.statusCode).not.toBe(404);
	});

	test.each([
		"channels",
		"extensions",
		"payments",
		"subscriptions",
		"tax-categories",
		"types",
		"zones",
	])("does not serve /in-store/key=:storeKey/%s", async (path) => {
		const response = await get(`/dummy/in-store/key=my-store/${path}`);
		expect(response.statusCode).toBe(404);
	});

	test("does not serve the project endpoint in-store", async () => {
		const response = await get("/dummy/in-store/key=my-store");
		expect(response.statusCode).toBe(404);
	});

	test("still serves those resources at project level", async () => {
		for (const path of ["channels", "extensions", "payments", "zones"]) {
			const response = await get(`/dummy/${path}`);
			expect(response.statusCode).toBe(200);
		}
	});
});
