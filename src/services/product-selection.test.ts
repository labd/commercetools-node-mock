import { describe, expect, test } from "vitest";
import { productSelectionDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("product-selection", () => {
	const productSelectionDraft = productSelectionDraftFactory(ctMock);

	test("Create product selection", async () => {
		const draft = productSelectionDraft.build({
			name: {
				en: "foo",
			},
			key: "foo",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-selections",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		const productSelection = response.json();

		expect(productSelection).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			name: {
				en: "foo",
			},
			key: "foo",
			version: 1,
			productCount: 0,
			mode: "Individual",
		});
	});
});
