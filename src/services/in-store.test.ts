import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";
import { storeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

const get = (url: string) => ctMock.app.inject({ method: "GET", url });

/**
 * commercetools documents in-store endpoints for a subset of resources only.
 * Everything else under /{projectKey}/in-store/key={storeKey} is a 404 on the
 * real API, so the mock must not accept it either.
 */
describe("in-store routes", () => {
	// In-store endpoints 404 when the store in the path doesn't exist, so the
	// store has to exist for these tests to be about route mounting.
	beforeAll(async () => {
		await storeDraftFactory(ctMock).create({ key: "my-store" });
	});

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

describe("in-store scoping", () => {
	const inject = (
		method: "GET" | "POST" | "DELETE",
		url: string,
		payload?: object,
	) => ctMock.app.inject({ method, url, payload });

	beforeEach(async () => {
		const stores = storeDraftFactory(ctMock);
		await stores.create({ key: "store-a" });
		await stores.create({ key: "store-b" });
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	const createCustomer = async (email: string, stores: string[]) => {
		const response = await inject("POST", "/dummy/customers", {
			email,
			password: "supersecret",
			stores: stores.map((key) => ({ typeId: "store", key })),
		});
		expect(response.statusCode, response.body).toBe(201);
		return response.json().customer;
	};

	test("lists the customers of the store and the global ones", async () => {
		const inA = await createCustomer("a@example.com", ["store-a"]);
		const inB = await createCustomer("b@example.com", ["store-b"]);
		const inBoth = await createCustomer("ab@example.com", [
			"store-a",
			"store-b",
		]);
		const global = await createCustomer("global@example.com", []);

		const response = await get("/dummy/in-store/key=store-a/customers");
		expect(response.statusCode).toBe(200);
		const ids = response.json().results.map((c: { id: string }) => c.id);
		expect(ids.sort()).toEqual([inA.id, inBoth.id, global.id].sort());
		expect(ids).not.toContain(inB.id);
		expect(response.json().total).toBe(3);

		const filtered = await get(
			`/dummy/in-store/key=store-a/customers?where=${encodeURIComponent('email="a@example.com"')}`,
		);
		expect(filtered.json().results.map((c: { id: string }) => c.id)).toEqual([
			inA.id,
		]);
	});

	test("does not serve a customer of another store", async () => {
		const inB = await createCustomer("b@example.com", ["store-b"]);
		const global = await createCustomer("global@example.com", []);

		expect(
			(await get(`/dummy/in-store/key=store-a/customers/${inB.id}`)).statusCode,
		).toBe(404);
		expect(
			(await get(`/dummy/in-store/key=store-b/customers/${inB.id}`)).statusCode,
		).toBe(200);
		expect(
			(await get(`/dummy/in-store/key=store-a/customers/${global.id}`))
				.statusCode,
		).toBe(200);

		const update = await inject(
			"POST",
			`/dummy/in-store/key=store-a/customers/${inB.id}`,
			{
				version: inB.version,
				actions: [{ action: "setFirstName", firstName: "x" }],
			},
		);
		expect(update.statusCode).toBe(404);

		const remove = await inject(
			"DELETE",
			`/dummy/in-store/key=store-a/customers/${inB.id}?version=${inB.version}`,
		);
		expect(remove.statusCode).toBe(404);
		expect((await get(`/dummy/customers/${inB.id}`)).statusCode).toBe(200);
	});

	test("only serves the carts of the store", async () => {
		const create = async (path: string) => {
			const response = await inject("POST", path, { currency: "EUR" });
			expect(response.statusCode, response.body).toBe(201);
			return response.json();
		};
		const inA = await create("/dummy/in-store/key=store-a/carts");
		const inB = await create("/dummy/in-store/key=store-b/carts");
		const withoutStore = await create("/dummy/carts");

		const list = await get("/dummy/in-store/key=store-a/carts");
		expect(list.json().results.map((c: { id: string }) => c.id)).toEqual([
			inA.id,
		]);

		expect(
			(await get(`/dummy/in-store/key=store-a/carts/${inA.id}`)).statusCode,
		).toBe(200);
		expect(
			(await get(`/dummy/in-store/key=store-a/carts/${inB.id}`)).statusCode,
		).toBe(404);
		expect(
			(await get(`/dummy/in-store/key=store-a/carts/${withoutStore.id}`))
				.statusCode,
		).toBe(404);

		expect((await get("/dummy/carts")).json().total).toBe(3);
	});

	test("assigns the store to a shopping list created in it", async () => {
		const response = await inject(
			"POST",
			"/dummy/in-store/key=store-a/shopping-lists",
			{ name: { en: "list" } },
		);
		expect(response.statusCode, response.body).toBe(201);
		expect(response.json().store).toEqual({ typeId: "store", key: "store-a" });

		const list = await get("/dummy/in-store/key=store-a/shopping-lists");
		expect(list.json().total).toBe(1);
		const other = await get("/dummy/in-store/key=store-b/shopping-lists");
		expect(other.json().total).toBe(0);
	});
});
