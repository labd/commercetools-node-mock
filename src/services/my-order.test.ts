import type { Order } from "@commercetools/platform-sdk";
import { afterEach, describe, expect, test } from "vitest";
import {
	anonymousSession,
	customerDraftFactory,
	customerSession,
} from "#src/testing/index.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

const ctMock = new CommercetoolsMock();

const addOrder = async (owner: {
	customerId?: string;
	anonymousId?: string;
}) => {
	const order: Order = {
		...getBaseResourceProperties(),
		...owner,
		customLineItems: [],
		lineItems: [],
		lastMessageSequenceNumber: 0,
		orderState: "Open",
		origin: "Customer",
		refusedGifts: [],
		shipping: [],
		shippingMode: "Single",
		syncInfo: [],
		totalPrice: {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 1000,
			fractionDigits: 2,
		},
	};
	await ctMock.project("dummy").unsafeAdd("order", order);
	return order;
};

describe("MyOrder", () => {
	const customerFactory = customerDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Get my order by id", async () => {
		const customer = await customerFactory.create({
			email: "mine@example.org",
		});
		const order = await addOrder({ customerId: customer.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/orders/${order.id}`,
			headers: customerSession(ctMock, customer.id).headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(order.id);
	});

	test("Get another customer's order by id", async () => {
		const customer = await customerFactory.create({
			email: "mine@example.org",
		});
		const other = await customerFactory.create({ email: "theirs@example.org" });
		const order = await addOrder({ customerId: other.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/orders/${order.id}`,
			headers: customerSession(ctMock, customer.id).headers,
		});

		// The order the caller may not see is indistinguishable from one that
		// does not exist
		expect(response.statusCode).toBe(404);
	});

	test("Get another customer's order in store", async () => {
		const customer = await customerFactory.create({
			email: "mine@example.org",
		});
		const other = await customerFactory.create({ email: "theirs@example.org" });
		const order = await addOrder({ customerId: other.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/in-store/key=some-store/me/orders/${order.id}`,
			headers: customerSession(ctMock, customer.id).headers,
		});

		expect(response.statusCode).toBe(404);
	});

	test("Query my orders", async () => {
		const customer = await customerFactory.create({
			email: "mine@example.org",
		});
		const other = await customerFactory.create({ email: "theirs@example.org" });
		const mine = await addOrder({ customerId: customer.id });
		await addOrder({ customerId: other.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/orders",
			headers: customerSession(ctMock, customer.id).headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(mine.id);
	});

	test("Query orders without a token", async () => {
		const customer = await customerFactory.create({
			email: "mine@example.org",
		});
		await addOrder({ customerId: customer.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/orders",
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("insufficient_scope");
	});

	test("An anonymous session sees its own orders", async () => {
		const session = await anonymousSession(ctMock, {
			anonymousId: "anon-1",
		});
		const mine = await addOrder({ anonymousId: "anon-1" });
		await addOrder({ anonymousId: "anon-2" });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/orders",
			headers: session.headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(mine.id);
	});
});
