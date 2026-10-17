import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const createApplication = async (ctMock: CommercetoolsMock) => {
	const response = await ctMock.app.inject({
		method: "POST",
		url: "/dummy/applications",
		payload: {
			key: "shop",
			name: "Shop",
			mode: "PaymentOnly",
			countries: ["NL"],
			allowedOrigins: { allowAll: true, origins: [] },
			paymentsConfiguration: { activePaymentComponentType: "Component" },
		},
	});
	return response.json();
};

describe("Checkout payment integration", () => {
	test("Create and update", async () => {
		const ctMock = new CommercetoolsMock();
		const application = await createApplication(ctMock);

		const created = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/payment-integrations",
			payload: {
				key: "adyen-card",
				application: { typeId: "application", id: application.id },
				connectorDeployment: { typeId: "deployment", id: "deployment-1" },
				name: "Adyen card",
				type: "card",
				componentType: "Component",
				displayInfo: { label: { en: "Card" } },
			},
		});
		expect(created.statusCode).toBe(201);
		const integration = created.json();
		expect(integration.status).toBe("Inactive");

		const updated = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/payment-integrations/${integration.id}`,
			payload: {
				version: integration.version,
				actions: [
					{ action: "setStatus", status: "Active" },
					{
						action: "setDisplayInfoPayButtonText",
						payButtonText: { en: "Pay" },
					},
					{
						action: "setAutomatedReversalConfigurationStatus",
						status: "Active",
					},
					{ action: "setSortingInfo", sortingInfo: { priority: 2 } },
				],
			},
		});
		expect(updated.statusCode).toBe(200);
		expect(updated.json()).toMatchObject({
			status: "Active",
			displayInfo: { label: { en: "Card" }, payButtonText: { en: "Pay" } },
			automatedReversalConfiguration: { status: "Active" },
			sortingInfo: { priority: 2 },
		});

		const byKey = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/payment-integrations/key=adyen-card",
		});
		expect(byKey.json().id).toBe(integration.id);
	});

	test("The application has to exist", async () => {
		const ctMock = new CommercetoolsMock();
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/payment-integrations",
			payload: {
				application: { typeId: "application", id: "missing" },
				connectorDeployment: { typeId: "deployment", id: "deployment-1" },
				name: "Adyen card",
				type: "card",
				componentType: "Component",
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toContain("missing");
	});
});
