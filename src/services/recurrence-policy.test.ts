import type { RecurrencePolicyDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("RecurrencePolicy", () => {
	test("Create recurrence policy", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "monthly-policy",
			name: {
				"en-GB": "Monthly Recurrence Policy",
			},
			description: {
				"en-GB": "A policy for monthly recurring orders",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Months",
			},
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			key: "monthly-policy",
			lastModifiedAt: expect.anything(),
			name: {
				"en-GB": "Monthly Recurrence Policy",
			},
			description: {
				"en-GB": "A policy for monthly recurring orders",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Months",
			},
			version: 1,
		});
	});

	test("Get recurrence policy", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "test-policy",
			name: {
				"en-GB": "Test Policy",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Days",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get recurrence policy by key", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "key-policy",
			name: {
				en: "Key Policy",
			},
			schedule: {
				type: "dayOfMonth",
				day: 15,
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurrence-policies/key=key-policy",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query recurrence policies", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "query-policy",
			name: {
				en: "Query Policy",
			},
			schedule: {
				type: "standard",
				value: 3,
				intervalUnit: "Months",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurrence-policies",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});

	test("Update recurrence policy - setName", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "update-name-policy",
			name: {
				en: "Original Name",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Weeks",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setName",
						name: {
							en: "Updated Name",
							de: "Aktualisierter Name",
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().name).toEqual({
			en: "Updated Name",
			de: "Aktualisierter Name",
		});
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurrence policy - setDescription", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "update-description-policy",
			name: {
				en: "Test Policy",
			},
			schedule: {
				type: "dayOfMonth",
				day: 10,
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setDescription",
						description: {
							en: "New description",
							de: "Neue Beschreibung",
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().description).toEqual({
			en: "New description",
			de: "Neue Beschreibung",
		});
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurrence policy - setKey", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "original-key",
			name: {
				en: "Test Policy",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Months",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().key).toBe("updated-key");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurrence policy - setSchedule", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "update-schedule-policy",
			name: {
				en: "Schedule Policy",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Weeks",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setSchedule",
						schedule: {
							type: "dayOfMonth",
							day: 25,
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().schedule).toEqual({
			type: "dayOfMonth",
			day: 25,
		});
		expect(updateResponse.json().version).toBe(2);
	});

	test("Delete recurrence policy", async () => {
		const draft: RecurrencePolicyDraft = {
			key: "delete-policy",
			name: {
				en: "Delete Policy",
			},
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Days",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurrence-policies",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/recurrence-policies/${createResponse.json().id}?version=${createResponse.json().version}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(createResponse.json());

		const getResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurrence-policies/${createResponse.json().id}`,
		});

		expect(getResponse.statusCode).toBe(404);
	});
});
