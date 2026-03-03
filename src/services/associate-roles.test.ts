import type { AssociateRole } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { associateRoleDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../ctMock.ts";

describe("Associate roles query", () => {
	const ctMock = new CommercetoolsMock();
	const associateRoleDraft = associateRoleDraftFactory(ctMock);
	let associateRole: AssociateRole | undefined;

	beforeEach(async () => {
		associateRole = await associateRoleDraft.create({
			name: "example-role",
			key: "example-role-associate-role",
		});
	});

	afterEach(async () => {
		await ctMock.clear();
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
