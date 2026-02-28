import type { ProductSelectionDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("product-selection", () => {
	test("Create product selection", async () => {
		const draft: ProductSelectionDraft = {
			name: {
				en: "foo",
			},
			key: "foo",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-selections",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
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
