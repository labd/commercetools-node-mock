import { afterEach, describe, expect, test } from "vitest";
import { cartDraftFactory, createAssociateScope } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("AsAssociate", () => {
	const cartFactory = cartDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Access as-associate service routes", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyCarts"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toEqual([]);
	});

	test("Create cart via as-associate", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["CreateMyCarts"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/carts`,
			payload: cartFactory.build({ currency: "EUR" }),
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().id).toBeDefined();
	});

	test("An associate without any role is refused", async () => {
		const scope = await createAssociateScope(ctMock, { permissions: [] });

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/carts`,
			payload: cartFactory.build({ currency: "EUR" }),
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("AssociateMissingPermission");
	});
});
