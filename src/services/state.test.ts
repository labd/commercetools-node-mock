import type { StateDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("State", () => {
	test("Create state", async () => {
		const draft: StateDraft = {
			key: "foo",
			type: "PaymentState",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/states",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			builtIn: false,
			createdAt: expect.anything(),
			id: expect.anything(),
			initial: false,
			key: "foo",
			lastModifiedAt: expect.anything(),
			transitions: [],
			type: "PaymentState",
			version: 1,
		});
	});

	test("Get state", async () => {
		const draft: StateDraft = {
			key: "foo",
			type: "PaymentState",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/states",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/states/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});
});
