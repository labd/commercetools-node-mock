import type { CustomObject } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { customObjectDraftFactory } from "#src/testing/index.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import { CommercetoolsMock } from "../index.ts";

describe("CustomObject create", () => {
	const ctMock = new CommercetoolsMock();
	const customObjectDraft = customObjectDraftFactory(ctMock);

	test("Create new object", async () => {
		const draft = customObjectDraft.build({
			container: "my-container",
			key: "my-key",
			value: "my-value",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/custom-objects",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		const customObject = response.json();
		expect(customObject.container).toBe("my-container");
		expect(customObject.key).toBe("my-key");
		expect(customObject.value).toBe("my-value");
	});
});

describe("CustomObject retrieve", () => {
	const ctMock = new CommercetoolsMock();
	const customObjectDraft = customObjectDraftFactory(ctMock);
	let customObject: CustomObject;

	beforeEach(async () => {
		customObject = await customObjectDraft.create({
			container: "my-container",
			key: "my-key",
			value: "my-value",
		});

		expect(customObject.container).toBe("my-container");
		expect(customObject.key).toBe("my-key");
		expect(customObject.value).toBe("my-value");
	});
	afterEach(async () => {
		ctMock.clear();
	});

	test("exists", async () => {
		const response = await ctMock.app.inject({
			method: "HEAD",
			url: "/dummy/custom-objects/my-container/my-key",
		});

		expect(response.statusCode).toBe(200);
	});

	test("non-existent", async () => {
		const response = await ctMock.app.inject({
			method: "HEAD",
			url: "/dummy/custom-objects/invalid-container/invalid",
		});

		expect(response.statusCode).toBe(404);
	});

	test("get", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/custom-objects/my-container/my-key",
		});

		expect(response.statusCode).toBe(200);
		const result = response.json();
		expect(result.container).toBe("my-container");
		expect(result.key).toBe("my-key");
		expect(result.value).toBe("my-value");
	});

	test("query with container", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/custom-objects/my-container",
		});

		expect(response.statusCode).toBe(200);
		const customObjects = response.json();
		expect(customObjects).toMatchObject({
			results: [
				{
					container: "my-container",
					key: "my-key",
					value: "my-value",
				},
			],
			total: 1,
		});
	});

	test("Update match current (no conflict)", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/custom-objects",
			payload: {
				container: "my-container",
				key: "my-key",
				value: "my-value",
			},
		});

		expect(response.statusCode).toBe(201);
	});

	test("New with version (errors)", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/custom-objects",
			payload: {
				container: "my-new-container",
				key: "my-new-key",
				value: "my-value",
				version: 2,
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toStrictEqual({
			statusCode: 400,
			message: "version on create must be 0",
			errors: [
				{
					code: "InvalidOperation",
					message: "version on create must be 0",
				},
			],
		});
	});

	test("Update match current with version (conflict)", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/custom-objects",
			payload: {
				container: "my-container",
				key: "my-key",
				value: "my-value",
				version: 2,
			},
		});

		expect(response.statusCode).toBe(409);
		expect(response.json()).toStrictEqual({
			statusCode: 409,
			message: `Object ${customObject.id} has a different version than expected. Expected: 2 - Actual: 1.`,
			errors: [
				{
					code: "ConcurrentModification",
					currentVersion: 1,
					message: `Object ${customObject.id} has a different version than expected. Expected: 2 - Actual: 1.`,
				},
			],
		});
	});

	test("can use the add function with the custom object name", async () => {
		ctMock.project("dummy").unsafeAdd("key-value-document", {
			...getBaseResourceProperties(),
			container: "my-container",
			key: "my-key",
			value: "my-value",
			version: 2,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/custom-objects/my-container/my-key",
		});

		expect(response.statusCode).toEqual(200);
		expect(response.json()).toEqual({
			container: "my-container",
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			key: "my-key",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			value: "my-value",
			version: 1,
		});
	});

	test("update with container and key", async () => {
		ctMock.project("dummy").unsafeAdd("key-value-document", {
			...getBaseResourceProperties(),
			container: "my-other-container",
			key: "my-key",
			value: "my-value",
			version: 2,
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/custom-objects/my-other-container/my-key",
			payload: {
				value: "new-value",
			},
		});

		expect(response.statusCode).toEqual(200);
		expect(response.json()).toEqual({
			container: "my-other-container",
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			key: "my-key",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			value: "new-value",
			version: 3,
		});
	});

	test("delete with container and key", async () => {
		const response = await ctMock.app.inject({
			method: "DELETE",
			url: "/dummy/custom-objects/my-container/my-key",
		});

		expect(response.statusCode).toEqual(200);
		expect(response.json()).toEqual({
			container: "my-container",
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			key: "my-key",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			value: "my-value",
			version: 1,
		});

		const fetchRes = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/custom-objects/my-container/my-key",
		});

		expect(fetchRes.statusCode).toEqual(404);
	});
});
