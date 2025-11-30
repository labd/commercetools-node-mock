import type { RecurrencePolicyDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
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
		const response = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/recurrence-policies/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/recurrence-policies/key=key-policy",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/recurrence-policies",
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurrence-policies/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setName",
						name: {
							en: "Updated Name",
							de: "Aktualisierter Name",
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.name).toEqual({
			en: "Updated Name",
			de: "Aktualisierter Name",
		});
		expect(updateResponse.body.version).toBe(2);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurrence-policies/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setDescription",
						description: {
							en: "New description",
							de: "Neue Beschreibung",
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.description).toEqual({
			en: "New description",
			de: "Neue Beschreibung",
		});
		expect(updateResponse.body.version).toBe(2);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurrence-policies/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.key).toBe("updated-key");
		expect(updateResponse.body.version).toBe(2);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurrence-policies/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setSchedule",
						schedule: {
							type: "dayOfMonth",
							day: 25,
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.schedule).toEqual({
			type: "dayOfMonth",
			day: 25,
		});
		expect(updateResponse.body.version).toBe(2);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurrence-policies")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const deleteResponse = await supertest(ctMock.app)
			.delete(`/dummy/recurrence-policies/${createResponse.body.id}`)
			.query({ version: createResponse.body.version });

		expect(deleteResponse.status).toBe(200);
		expect(deleteResponse.body).toEqual(createResponse.body);

		const getResponse = await supertest(ctMock.app).get(
			`/dummy/recurrence-policies/${createResponse.body.id}`,
		);

		expect(getResponse.status).toBe(404);
	});
});
