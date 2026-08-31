import { afterEach, describe, expect, test } from "vitest";
import {
	createAssociateScope,
	customerDraftFactory,
	shoppingListDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("AsAssociateShoppingList", () => {
	const factory = shoppingListDraftFactory(ctMock);

	let colleagues = 0;
	const colleagueId = async () => {
		colleagues += 1;
		const customer = await customerDraftFactory(ctMock).create({
			email: `list-colleague-${colleagues}@example.com`,
		});
		return customer.id;
	};

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Create shopping list", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["CreateMyShoppingLists"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/shopping-lists`,
			payload: { name: { en: "My list" } },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().customer).toEqual({
			typeId: "customer",
			id: scope.associateId,
		});
	});

	test("Get own shopping list", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["CreateMyShoppingLists", "ViewMyShoppingLists"],
		});

		const created = await ctMock.app.inject({
			method: "POST",
			url: `${scope.basePath}/shopping-lists`,
			payload: { name: { en: "Groceries" } },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/shopping-lists/${created.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(created.json().id);
	});

	test("Get a colleague's shopping list needs ViewOthersShoppingLists", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyShoppingLists"],
		});

		const list = await factory.create({
			name: { en: "Errands" },
			customer: { typeId: "customer", id: await colleagueId() },
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/shopping-lists/${list.id}`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].permissions).toEqual([
			"ViewOthersShoppingLists",
		]);
	});

	test("Query shopping lists is narrowed to the caller", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["ViewMyShoppingLists"],
		});

		const own = await factory.create({
			name: { en: "Mine" },
			customer: { typeId: "customer", id: scope.associateId },
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});
		await factory.create({
			name: { en: "Theirs" },
			customer: { typeId: "customer", id: await colleagueId() },
			businessUnit: { typeId: "business-unit", key: scope.businessUnitKey },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${scope.basePath}/shopping-lists`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(own.id);
	});
});
