import type { AssociateRole } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../ctMock.ts";

describe("Associate roles query", () => {
	const ctMock = new CommercetoolsMock();
	let associateRole: AssociateRole | undefined;

	beforeEach(async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/associate-roles",
			payload: {
				name: "example-role",
				buyerAssignable: false,
				key: "example-role-associate-role",
				permissions: ["ViewMyQuotes", "ViewMyOrders", "ViewMyCarts"],
			},
		});

		expect(response.statusCode).toBe(201);

		associateRole = response.json() as AssociateRole;
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no filter", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/associate-roles?{}",
		});

		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBe(1);

		associateRole = body.results[0] as AssociateRole;

		expect(associateRole.key).toBe("example-role-associate-role");
	});
});
