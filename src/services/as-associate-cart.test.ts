import { afterEach, describe, expect, test } from "vitest";
import {
	cartDraftFactory,
	createAssociateScope,
	customerDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("AsAssociateCart", () => {
	const factory = cartDraftFactory(ctMock);

	const colleagueId = async () =>
		(await customerDraftFactory(ctMock).create()).id;

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Create cart", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["CreateMyCarts", "ViewMyCarts"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/carts`,
			payload: factory.build({ currency: "EUR" }),
		});

		expect(response.statusCode).toBe(201);

		// The cart is stamped with the scope that created it, so it stays visible
		// to that scope
		expect(response.json().customerId).toBe(scope.associateId);
		expect(response.json().businessUnit).toEqual({
			typeId: "business-unit",
			key: scope.businessUnitKey,
		});
	});

	test("Create cart without the permission", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyCarts"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/carts`,
			payload: factory.build({ currency: "EUR" }),
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("AssociateMissingPermission");
		expect(response.json().errors[0].permissions).toEqual(["CreateMyCarts"]);
	});

	test("Get own cart", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["CreateMyCarts", "ViewMyCarts"],
		});

		const created = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/carts`,
			payload: factory.build({ currency: "EUR" }),
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts/${created.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(created.json().id);
	});

	test("Get a colleague's cart needs ViewOthersCarts", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyCarts"],
		});

		const colleagueCart = await factory.create({
			currency: "EUR",
			customerId: await colleagueId(),
			businessUnit: {
				typeId: "business-unit",
				key: scope.businessUnitKey,
			},
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts/${colleagueCart.id}`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].permissions).toEqual(["ViewOthersCarts"]);
	});

	test("Query carts is narrowed to the caller with only ViewMyCarts", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyCarts"],
		});

		const own = await factory.create({
			currency: "EUR",
			customerId: scope.associateId,
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});
		await factory.create({
			currency: "EUR",
			customerId: await colleagueId(),
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(own.id);
	});

	test("Query carts covers the unit with ViewOthersCarts", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewOthersCarts"],
		});

		await factory.create({
			currency: "EUR",
			customerId: scope.associateId,
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});
		await factory.create({
			currency: "EUR",
			customerId: await colleagueId(),
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});
		// A cart of another business unit is never in scope
		await factory.create({ currency: "EUR" });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(2);
	});

	test("Query carts without a view permission", async () => {
		const scope = await createAssociateScope(ctMock, { permissions: [] });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/carts`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].permissions).toEqual([
			"ViewMyCarts",
			"ViewOthersCarts",
		]);
	});

	test("A customer who is not an associate of the unit", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewOthersCarts"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/as-associate/1e6b4d5f-0a3c-4c2e-9d7a-8b5c6d7e8f90/in-business-unit/key=${scope.businessUnitKey}/carts`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("AssociateMissingPermission");
	});

	test("An unknown business unit", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewOthersCarts"],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/as-associate/${scope.associateId}/in-business-unit/key=does-not-exist/carts`,
		});

		expect(response.statusCode).toBe(404);
	});
});
