import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	businessUnitDraftFactory,
	createAssociateScope,
	loginCustomer,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyBusinessUnit", () => {
	const businessUnitFactory = businessUnitDraftFactory(ctMock);

	let scope: Awaited<ReturnType<typeof createAssociateScope>>;
	let headers: { authorization: string };

	beforeEach(async () => {
		scope = await createAssociateScope(ctMock);
		const customer = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/customers/${scope.associateId}`,
		});
		headers = (
			await loginCustomer(ctMock, {
				email: customer.json().email,
				password: "my-secret-pw",
			})
		).headers;
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Get my business units", async () => {
		// A unit the caller is not an associate of
		await businessUnitFactory.create({
			key: "someone-elses-unit",
			unitType: "Company",
			name: "Someone else",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/business-units",
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].key).toBe(scope.businessUnitKey);
	});

	test("Get my business unit by key", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/key=${scope.businessUnitKey}`,
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().key).toBe(scope.businessUnitKey);
	});

	test("Get a business unit the caller is not an associate of", async () => {
		const other = await businessUnitFactory.create({
			key: "someone-elses-unit",
			unitType: "Company",
			name: "Someone else",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/${other.id}`,
			headers,
		});

		expect(response.statusCode).toBe(404);
	});

	test("Update my business unit", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/me/business-units/key=${scope.businessUnitKey}`,
			payload: {
				version: 1,
				actions: [{ action: "changeName", name: "Updated Name" }],
			},
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().name).toBe("Updated Name");
	});

	test("Without a customer token", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/business-units",
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("insufficient_scope");
	});
});
