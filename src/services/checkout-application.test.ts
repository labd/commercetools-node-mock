import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const draft = {
	key: "shop",
	name: "Shop",
	mode: "CompleteFlow",
	status: "Active",
	countries: ["NL"],
	allowedOrigins: { allowAll: false, origins: ["https://shop.example.com"] },
	logo: { url: "https://shop.example.com/logo.svg" },
	description: { en: "Checkout for the shop" },
	paymentsConfiguration: { activePaymentComponentType: "Component" },
};

const mswServer = setupServer();

describe("Checkout application", () => {
	beforeAll(() => mswServer.listen({ onUnhandledFrame: "error" }));
	afterAll(() => mswServer.close());

	test("Create, update and delete", async () => {
		const ctMock = new CommercetoolsMock();
		const created = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/applications",
			payload: draft,
		});
		expect(created.statusCode).toBe(201);
		const application = created.json();
		expect(application).toMatchObject({
			key: "shop",
			status: "Active",
			agreements: [],
			description: { en: "Checkout for the shop" },
		});

		const updated = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/applications/key=shop",
			payload: {
				version: application.version,
				actions: [
					{ action: "setName", name: "Shop NL" },
					{ action: "addCountry", country: "BE" },
					{ action: "setDescription", description: {} },
					{
						action: "setAgreements",
						agreements: [
							{
								name: "terms",
								type: "MandatoryCheckbox",
								status: "Active",
								text: { en: "I agree." },
							},
						],
					},
				],
			},
		});
		expect(updated.statusCode).toBe(200);
		const result = updated.json();
		expect(result.name).toBe("Shop NL");
		expect(result.countries).toEqual(["NL", "BE"]);
		expect(result.description).toBeUndefined();
		expect(result.agreements).toHaveLength(1);
		expect(result.agreements[0].id).toBeTruthy();

		const reordered = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/applications/${application.id}`,
			payload: {
				version: result.version,
				actions: [
					{
						action: "setAgreementStatus",
						agreementId: result.agreements[0].id,
						status: "Inactive",
					},
				],
			},
		});
		expect(reordered.json().agreements[0].status).toBe("Inactive");

		const deleted = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/applications/key=shop?version=${reordered.json().version}`,
		});
		expect(deleted.statusCode).toBe(200);
		const gone = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/applications/key=shop",
		});
		expect(gone.statusCode).toBe(404);
	});

	test("A CompleteFlow application needs a logo", async () => {
		const ctMock = new CommercetoolsMock();
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/applications",
			payload: { ...draft, logo: undefined },
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toContain("logo");
	});

	test("A key is unique", async () => {
		const ctMock = new CommercetoolsMock();
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/applications",
			payload: draft,
		});
		const duplicate = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/applications",
			payload: draft,
		});
		expect(duplicate.statusCode).toBe(400);
		expect(duplicate.json().errors[0].code).toBe("DuplicateField");
	});

	test("Is served on the Checkout API's host", async () => {
		const ctMock = new CommercetoolsMock();
		ctMock.registerHandlers(mswServer);
		try {
			const response = await fetch(
				"https://checkout.europe-west1.gcp.commercetools.com/dummy/applications",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(draft),
				},
			);
			expect(response.status).toBe(201);
			const list = await fetch(
				"https://checkout.europe-west1.gcp.commercetools.com/dummy/applications",
			);
			expect((await list.json()).results).toHaveLength(1);
		} finally {
			mswServer.resetHandlers();
		}
	});
});
