import { describe, expect, test } from "vitest";
import { stateDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("State", () => {
	const stateDraft = stateDraftFactory(ctMock);

	test("Create state", async () => {
		const draft = stateDraft.build({ key: "foo", type: "PaymentState" });

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/states",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			builtIn: false,
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			initial: false,
			key: "foo",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			transitions: [],
			type: "PaymentState",
			version: 1,
		});
	});

	test("Get state", async () => {
		const state = await stateDraft.create({ key: "foo", type: "PaymentState" });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/states/${state.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(state);
	});
});
