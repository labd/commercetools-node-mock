import { afterEach, describe, expect, test } from "vitest";
import { createAssociateScope } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";

describe("AsAssociateBusinessUnit", () => {
	afterEach(async () => {
		await ctMock.clear();
	});

	test("Get business units as associate", async () => {
		const scope = await createAssociateScope(ctMock);
		// A unit the associate has nothing to do with
		await createAssociateScope(ctMock);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].key).toBe(scope.businessUnitKey);
	});

	test("Get business unit by key as associate", async () => {
		const scope = await createAssociateScope(ctMock);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units/key=${scope.businessUnitKey}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().key).toBe(scope.businessUnitKey);
	});

	test("Get a business unit the caller is not an associate of", async () => {
		const scope = await createAssociateScope(ctMock);
		const other = await createAssociateScope(ctMock);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units/key=${other.businessUnitKey}`,
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("AssociateMissingPermission");
	});

	test("Update business unit details", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["UpdateBusinessUnitDetails"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units/key=${scope.businessUnitKey}`,
			payload: {
				version: 1,
				actions: [{ action: "changeName", name: "Updated Name" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().name).toBe("Updated Name");
	});

	test("Update business unit details without the permission", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["UpdateAssociates"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units/key=${scope.businessUnitKey}`,
			payload: {
				version: 1,
				actions: [{ action: "changeName", name: "Updated Name" }],
			},
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].permissions).toEqual([
			"UpdateBusinessUnitDetails",
		]);
	});

	test("Changing associates needs UpdateAssociates", async () => {
		const scope = await createAssociateScope(ctMock, {
			permissions: ["UpdateBusinessUnitDetails"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${scope.associateId}/business-units/key=${scope.businessUnitKey}`,
			payload: {
				version: 1,
				actions: [{ action: "setAssociates", associates: [] }],
			},
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].permissions).toEqual(["UpdateAssociates"]);
	});
});
