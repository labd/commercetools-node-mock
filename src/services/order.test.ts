import assert from "node:assert";
import type {
	DeliveryDraft,
	Order,
	Payment,
	State,
} from "@commercetools/platform-sdk";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	test,
} from "vitest";
import { generateRandomString } from "#src/helpers.ts";
import {
	cartDraftFactory,
	channelDraftFactory,
	orderDraftFactory,
	typeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

describe("Order Query", () => {
	const ctMock = new CommercetoolsMock();
	const cartDraft = cartDraftFactory(ctMock);
	const orderDraft = orderDraftFactory(ctMock);
	let order: Order | undefined;

	beforeEach(async () => {
		const cart = await cartDraft.create({
			currency: "EUR",
			custom: {
				type: {
					key: "my-cart",
				},
				fields: {
					description: "example description",
				},
			},
		});

		order = await orderDraft.create({
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			version: cart.version,
			orderNumber: "foobar",
		});
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("no filter", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/orders",
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBe(1);
		expect(response.json().total).toBe(1);
		expect(response.json().offset).toBe(0);
		expect(response.json().limit).toBe(20);
	});

	test("filter orderNumber", async () => {
		assert(order, "order not created");

		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/orders",
				query: { where: 'orderNumber="nomatch"' },
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().count).toBe(0);
		}
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/orders",
				query: { where: 'orderNumber="foobar"' },
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().count).toBe(1);
		}
	});

	test("expand payment without payments", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/orders/${order.id}`,
			query: { expand: "paymentInfo.payments[*].paymentStatus.state" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(order.id);
	});
});

describe("Order payment tests", () => {
	const ctMock = new CommercetoolsMock({
		defaultProjectKey: "dummy",
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("query payment id", async () => {
		const state: State = {
			...getBaseResourceProperties(),
			builtIn: false,
			initial: false,
			key: "PaymentSuccess",
			type: "PaymentState",
		};

		const payment: Payment = {
			...getBaseResourceProperties(),
			interfaceInteractions: [],
			paymentStatus: {
				state: {
					typeId: "state",
					id: state.id,
				},
			},
			amountPlanned: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 1234,
				currencyCode: "EUR",
			},
			paymentMethodInfo: {
				paymentInterface: "buckaroo",
				method: "mastercard",
			},
			version: 2,
			transactions: [
				{
					id: "fake-transaction-id",
					type: "Charge",
					amount: {
						centAmount: 1234,
						currencyCode: "EUR",
						type: "centPrecision",
						fractionDigits: 2,
					},
					state: "Success",
				},
			],
		};

		const order: Order = {
			...getBaseResourceProperties(),
			customLineItems: [],
			lastMessageSequenceNumber: 0,
			lineItems: [],
			orderNumber: "1337",
			orderState: "Open",
			origin: "Customer",
			paymentInfo: {
				payments: [
					{
						typeId: "payment",
						id: payment.id,
					},
				],
			},
			refusedGifts: [],
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			totalPrice: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 2000,
				currencyCode: "EUR",
			},
		};

		await ctMock.project().unsafeAdd("state", state);
		await ctMock.project().unsafeAdd("payment", payment);
		await ctMock.project().unsafeAdd("order", order);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/orders",
			query: { where: `paymentInfo(payments(id="${payment.id}"))` },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results[0].id).toBe(order.id);

		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/orders",
				query: { where: "paymentInfo(payments(id is defined))" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().results[0].id).toBe(order.id);
		}
	});

	test("expand payment states", async () => {
		const state: State = {
			...getBaseResourceProperties(),
			builtIn: false,
			initial: false,
			key: "PaymentSuccess",
			type: "PaymentState",
		};

		const payment: Payment = {
			...getBaseResourceProperties(),
			interfaceInteractions: [],
			paymentStatus: {
				state: {
					typeId: "state",
					id: state.id,
				},
			},
			amountPlanned: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 1234,
				currencyCode: "EUR",
			},
			paymentMethodInfo: {
				paymentInterface: "buckaroo",
				method: "mastercard",
			},
			version: 2,
			transactions: [
				{
					id: "fake-transaction-id",
					type: "Charge",
					amount: {
						centAmount: 1234,
						currencyCode: "EUR",
						type: "centPrecision",
						fractionDigits: 2,
					},
					state: "Success",
				},
			],
		};

		const order: Order = {
			...getBaseResourceProperties(),
			customLineItems: [],
			lastMessageSequenceNumber: 0,
			lineItems: [],
			orderNumber: "1337",
			orderState: "Open",
			origin: "Customer",
			paymentInfo: {
				payments: [
					{
						typeId: "payment",
						id: payment.id,
					},
				],
			},
			refusedGifts: [],
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			totalPrice: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 2000,
				currencyCode: "EUR",
			},
		};

		await ctMock.project().unsafeAdd("state", state);
		await ctMock.project().unsafeAdd("payment", payment);
		await ctMock.project().unsafeAdd("order", order);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/orders/order-number=${order.orderNumber}`,
			query: { expand: "paymentInfo.payments[*].paymentStatus.state" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(order.id);
		const maybePayment = response.json().paymentInfo.payments[0].obj;
		expect(maybePayment).toBeDefined();
		expect(maybePayment.paymentStatus.state.obj).toBeDefined();
	});

	test("get by orderNumber - not found", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/orders/order-number=nonexistent",
		});

		expect(response.statusCode).toBe(404);
		expect(response.json()).toEqual({
			statusCode: 404,
			message: "The Resource with key 'nonexistent' was not found.",
			errors: [
				{
					code: "ResourceNotFound",
					message: "The Resource with key 'nonexistent' was not found.",
				},
			],
		});
	});
});

describe("Order Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	const cartDraft = cartDraftFactory(ctMock);
	const orderDraft = orderDraftFactory(ctMock);
	let order: Order | undefined;

	beforeEach(async () => {
		const cart = await cartDraft.create({
			currency: "EUR",
		});

		order = await orderDraft.create({
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			version: cart.version,
		});
	});

	test("no update", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().locale).toBe("nl-NL");

		const responseAgain = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 2,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			},
		});
		expect(responseAgain.statusCode).toBe(200);
		expect(responseAgain.json().version).toBe(2);
		expect(responseAgain.json().locale).toBe("nl-NL");
	});

	test("setCustomerEmail", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setCustomerEmail", email: "john@doe.com" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().customerEmail).toBe("john@doe.com");
	});

	test("setCustomerId", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setCustomerId",
						customerId: "9e3479fc-cc92-4d10-820a-a080b45ddcc1",
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().customerId).toBe(
			"9e3479fc-cc92-4d10-820a-a080b45ddcc1",
		);
	});

	test("setOrderNumber", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setOrderNumber", orderNumber: "5000123" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().orderNumber).toBe("5000123");
	});

	test("setPurchaseOrderNumber", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setPurchaseOrderNumber", purchaseOrderNumber: "abc123" },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().purchaseOrderNumber).toBe("abc123");
	});

	test("changeOrderState", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [{ action: "changeOrderState", orderState: "Complete" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().orderState).toBe("Complete");
	});

	test("changePaymentState | changeOrderState", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "changeOrderState", orderState: "Cancelled" },
					{ action: "changePaymentState", paymentState: "Failed" },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().orderState).toBe("Cancelled");
		expect(response.json().paymentState).toBe("Failed");
	});

	test("changeShipmentState", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [{ action: "changeShipmentState", shipmentState: "Delayed" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().shipmentState).toBe("Delayed");
	});

	test("setDeliveryCustomField", async () => {
		const order: Order = {
			...getBaseResourceProperties(),
			customLineItems: [],
			lastMessageSequenceNumber: 0,
			lineItems: [],
			orderNumber: "1389",
			orderState: "Open",
			origin: "Customer",
			paymentInfo: {
				payments: [
					{
						typeId: "payment",
						id: generateRandomString(10),
					},
				],
			},
			refusedGifts: [],
			shippingInfo: {
				shippingMethodName: "Home delivery (package)",
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 999,
					fractionDigits: 2,
				},
				shippingRate: {
					price: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 999,
						fractionDigits: 2,
					},
					tiers: [
						{
							type: "CartScore",
							score: 24,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 1998,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 47,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 2997,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 70,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 3996,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 93,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 4995,
								fractionDigits: 2,
							},
						},
					],
				},
				deliveries: [
					{
						id: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						key: "CT-Z243002",
						createdAt: "2024-07-29T13:37:48.047Z",
						items: [
							{
								id: "5d209544-2892-45c9-bef0-dde4e250188e",
								quantity: 1,
							},
						],
						parcels: [],
						custom: {
							type: {
								typeId: "type",
								id: "c493b7bb-d415-450c-b421-e128a8b26569",
							},
							fields: {
								location: "test",
								status: "created",
								carrier: "test_carrier",
							},
						},
					},
				],
				shippingMethodState: "MatchesCart",
			},
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			totalPrice: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 2000,
				currencyCode: "EUR",
			},
		};
		await ctMock.project("dummy").unsafeAdd("order", order);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/orders/order-number=${order.orderNumber}`,
		});

		// check if status is set
		const _updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${response.json().id}`,
			payload: {
				version: 0,
				actions: [
					{
						action: "setDeliveryCustomField",
						deliveryId: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "status",
						value: "delayed",
					},
				],
			},
		});
		expect(_updateResponse.statusCode).toBe(200);
		expect(_updateResponse.json().version).toBe(1);
		expect(
			_updateResponse.json().shippingInfo.deliveries[0].custom.fields.status,
		).toBe("delayed");

		// check if other field can be set
		const _updateResponse2 = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${response.json().id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setDeliveryCustomField",
						deliveryId: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "carrier",
						value: "dhl",
					},
				],
			},
		});
		expect(_updateResponse2.statusCode).toBe(200);
		expect(_updateResponse2.json().version).toBe(2);
		expect(
			_updateResponse2.json().shippingInfo.deliveries[0].custom.fields.carrier,
		).toBe("dhl");
	});

	test("setLineItemCustomField", async () => {
		const order: Order = {
			...getBaseResourceProperties(),
			version: 1,
			customLineItems: [],
			directDiscounts: [],
			discountCodes: [],
			lineItems: [
				{
					id: "d70b14c8-72cf-4cab-82ba-6339cebe1e79",
					productId: "06028a97-d622-47ac-a194-a3d90baa2b3c",
					productSlug: { "nl-NL": "test-product" },
					productType: { typeId: "product-type", id: "some-uuid" },
					name: { "nl-NL": "test product" },
					custom: {
						type: {
							typeId: "type",
							id: "a493b7bb-d415-450c-b421-e128a8b26569",
						},
						fields: {},
					},
					variant: {
						id: 1,
						sku: "1337",
						attributes: [{ name: "test", value: "test" }],
						prices: [],
						assets: [],
						images: [],
					},
					price: {
						id: "2f59a6c9-6a86-48d3-87f9-fabb3b12fd93",
						value: {
							type: "centPrecision",
							centAmount: 14900,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
					totalPrice: {
						type: "centPrecision",
						currencyCode: "EUR",
						fractionDigits: 2,
						centAmount: 14900,
					},
					taxedPricePortions: [],
					perMethodTaxRate: [],
					quantity: 1,
					discountedPricePerQuantity: [],
					lineItemMode: "Standard",
					priceMode: "Platform",
					state: [],
				},
			],
			orderState: "Open",
			origin: "Customer",
			refusedGifts: [],
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			taxCalculationMode: "LineItemLevel",
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			totalPrice: {
				type: "centPrecision",
				centAmount: 14900,
				currencyCode: "EUR",
				fractionDigits: 0,
			},
		};

		await ctMock.project("dummy").unsafeAdd("order", order);

		const lineItem = order.lineItems[0];
		assert(lineItem, "lineItem not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: order.version,
				actions: [
					{
						action: "setLineItemCustomField",
						lineItemId: lineItem.id,
						name: "foo",
						value: "bar",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toMatchObject([
			{
				id: lineItem.id,
				custom: {
					fields: {
						foo: "bar",
					},
				},
			},
		]);
	});

	test("setLineItemCustomType", async () => {
		const order: Order = {
			...getBaseResourceProperties(),
			version: 1,
			customLineItems: [],
			directDiscounts: [],
			discountCodes: [],
			lineItems: [
				{
					id: "d70b14c8-72cf-4cab-82ba-6339cebe1e79",
					productId: "06028a97-d622-47ac-a194-a3d90baa2b3c",
					productSlug: { "nl-NL": "test-product" },
					productType: { typeId: "product-type", id: "some-uuid" },
					name: { "nl-NL": "test product" },
					variant: {
						id: 1,
						sku: "1337",
						attributes: [{ name: "test", value: "test" }],
						prices: [],
						assets: [],
						images: [],
					},
					price: {
						id: "2f59a6c9-6a86-48d3-87f9-fabb3b12fd93",
						value: {
							type: "centPrecision",
							centAmount: 14900,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
					totalPrice: {
						type: "centPrecision",
						currencyCode: "EUR",
						fractionDigits: 2,
						centAmount: 14900,
					},
					taxedPricePortions: [],
					perMethodTaxRate: [],
					quantity: 1,
					discountedPricePerQuantity: [],
					lineItemMode: "Standard",
					priceMode: "Platform",
					state: [],
				},
			],
			orderState: "Open",
			origin: "Customer",
			refusedGifts: [],
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			taxCalculationMode: "LineItemLevel",
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			totalPrice: {
				type: "centPrecision",
				centAmount: 14900,
				currencyCode: "EUR",
				fractionDigits: 0,
			},
		};

		await ctMock.project("dummy").unsafeAdd("order", order);

		const typeDraft = typeDraftFactory(ctMock);
		const type = await typeDraft.create({
			key: "my-type",
			name: {
				en: "My Type",
			},
			description: {
				en: "My Type Description",
			},
			fieldDefinitions: [
				{
					name: "foo",
					label: {
						en: "foo",
					},
					required: false,
					type: {
						name: "String",
					},
					inputHint: "SingleLine",
				},
			],
		});

		const lineItem = order.lineItems[0];
		assert(lineItem, "lineItem not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: order.version,
				actions: [
					{
						action: "setLineItemCustomType",
						lineItemId: lineItem.id,
						type: {
							typeId: "type",
							id: type.id,
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toMatchObject([
			{
				id: lineItem.id,
				custom: {
					type: {
						typeId: "type",
						id: type.id,
					},
				},
			},
		]);
	});

	test("setParcelCustomField", async () => {
		const order: Order = {
			...getBaseResourceProperties(),
			customLineItems: [],
			lastMessageSequenceNumber: 0,
			lineItems: [],
			orderNumber: "1390",
			orderState: "Open",
			origin: "Customer",
			paymentInfo: {
				payments: [
					{
						typeId: "payment",
						id: generateRandomString(10),
					},
				],
			},
			refusedGifts: [],
			shippingInfo: {
				shippingMethodName: "Home delivery (package)",
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 999,
					fractionDigits: 2,
				},
				shippingRate: {
					price: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 999,
						fractionDigits: 2,
					},
					tiers: [
						{
							type: "CartScore",
							score: 24,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 1998,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 47,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 2997,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 70,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 3996,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 93,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 4995,
								fractionDigits: 2,
							},
						},
					],
				},
				deliveries: [
					{
						id: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						key: "CT-Z243002",
						createdAt: "2024-07-29T13:37:48.047Z",
						items: [
							{
								id: "5d209544-2892-45c9-bef0-dde4e250188e",
								quantity: 1,
							},
						],
						parcels: [
							{
								id: "7a458cad-dd46-4f5f-8b73-debOede6a17d",
								createdAt: "2024-07-29T13:37:48.047Z",
								items: [
									{
										id: "5d209544-2892-45c9-bef0-dde4e250188e",
										quantity: 1,
									},
								],
								custom: {
									type: {
										typeId: "type",
										id: "c493b7bb-d415-450c-b421-e128a8b26569",
									},
									fields: {
										status: "created",
									},
								},
							},
						],
					},
				],
				shippingMethodState: "MatchesCart",
			},
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			totalPrice: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 2000,
				currencyCode: "EUR",
			},
		};
		await ctMock.project("dummy").unsafeAdd("order", order);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/orders/order-number=${order.orderNumber}`,
		});

		// check if status is set
		const _updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${response.json().id}`,
			payload: {
				version: 0,
				actions: [
					{
						action: "setParcelCustomField",
						parcelId: "7a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "status",
						value: "delayed",
					},
				],
			},
		});
		expect(_updateResponse.statusCode).toBe(200);
		expect(_updateResponse.json().version).toBe(1);
		expect(
			_updateResponse.json().shippingInfo.deliveries[0].parcels[0].custom.fields
				.status,
		).toBe("delayed");
	});

	test("updateSyncInfo", async () => {
		assert(order, "order not created");

		const channelDraft = channelDraftFactory(ctMock);
		const channel = await channelDraft.create({
			key: "order-sync",
			roles: ["OrderImport", "OrderExport"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/orders/${order.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "updateSyncInfo",
						channel: { typeId: "channel", key: "order-sync" },
						externalId: "1234",
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().syncInfo).toMatchObject([
			{
				channel: { typeId: "channel", id: channel.id },
				externalId: "1234",
			},
		]);
	});

	describe("addDelivery", () => {
		const order: Order = {
			...getBaseResourceProperties(),
			customLineItems: [],
			lineItems: [
				{
					id: "d70b14c8-72cf-4cab-82ba-6339cebe1e79",
					productId: "06028a97-d622-47ac-a194-a3d90baa2b3c",
					productSlug: { "nl-NL": "test-product" },
					productType: { typeId: "product-type", id: "some-uuid" },
					name: { "nl-NL": "test product" },
					custom: {
						type: {
							typeId: "type",
							id: "a493b7bb-d415-450c-b421-e128a8b26569",
						},
						fields: {},
					},
					variant: {
						id: 1,
						sku: "1337",
						attributes: [{ name: "test", value: "test" }],
						prices: [],
						assets: [],
						images: [],
					},
					price: {
						id: "2f59a6c9-6a86-48d3-87f9-fabb3b12fd93",
						value: {
							type: "centPrecision",
							centAmount: 14900,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
					totalPrice: {
						type: "centPrecision",
						currencyCode: "EUR",
						fractionDigits: 2,
						centAmount: 14900,
					},
					taxedPricePortions: [],
					perMethodTaxRate: [],
					quantity: 1,
					discountedPricePerQuantity: [],
					lineItemMode: "Standard",
					priceMode: "Platform",
					state: [],
				},
			],
			orderNumber: "7777",
			orderState: "Open",
			origin: "Customer",
			paymentInfo: {
				payments: [
					{
						typeId: "payment",
						id: generateRandomString(10),
					},
				],
			},
			refusedGifts: [],
			shippingInfo: {
				shippingMethodName: "Home delivery (package)",
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 999,
					fractionDigits: 2,
				},
				shippingRate: {
					price: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 999,
						fractionDigits: 2,
					},
					tiers: [
						{
							type: "CartScore",
							score: 24,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 1998,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 47,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 2997,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 70,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 3996,
								fractionDigits: 2,
							},
						},
						{
							type: "CartScore",
							score: 93,
							price: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 4995,
								fractionDigits: 2,
							},
						},
					],
				},
				deliveries: [
					{
						id: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						key: "CT-Z243002",
						createdAt: "2024-07-29T13:37:48.047Z",
						items: [
							{
								id: "d70b14c8-72cf-4cab-82ba-6339cebe1e79",
								quantity: 1,
							},
						],
						parcels: [
							{
								id: "7a458cad-dd46-4f5f-8b73-debOede6a17d",
								createdAt: "2024-07-29T13:37:48.047Z",
								items: [
									{
										id: "d70b14c8-72cf-4cab-82ba-6339cebe1e79",
										quantity: 1,
									},
								],
								custom: {
									type: {
										typeId: "type",
										id: "c493b7bb-d415-450c-b421-e128a8b26569",
									},
									fields: {
										status: "created",
									},
								},
							},
						],
					},
				],
				shippingMethodState: "MatchesCart",
			},
			shipping: [],
			shippingMode: "Single",
			syncInfo: [],
			totalPrice: {
				type: "centPrecision",
				fractionDigits: 2,
				centAmount: 2000,
				currencyCode: "EUR",
			},
		};
		if (!order.shippingInfo) {
			throw new Error("Order shippingInfo is required");
		}
		const { deliveries: _, ...shippingInfoWithoutDeliveries } =
			order.shippingInfo;
		const orderWithoutDeliveries = {
			...order,
			...getBaseResourceProperties(),
			orderNumber: "7778",
			shippingInfo: shippingInfoWithoutDeliveries,
		};

		const deliveryDraft: DeliveryDraft = {
			key: `${order.orderNumber}-2`,
			items: [
				{
					id: order.lineItems[0].id,
					quantity: order.lineItems[0].quantity,
				},
			],
		};

		beforeAll(async () => {
			await ctMock.project("dummy").unsafeAdd("order", order);
			await ctMock.project("dummy").unsafeAdd("order", orderWithoutDeliveries);
		});

		it.each([
			[order, 1],
			[orderWithoutDeliveries, 0],
		])("should add to deliveries", async (order, index) => {
			const response = await ctMock.app.inject({
				method: "GET",
				url: `/dummy/orders/order-number=${order.orderNumber}`,
			});
			const _updateResponse = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/orders/${response.json().id}`,
				payload: {
					version: 0,
					actions: [
						{
							action: "addDelivery",
							...deliveryDraft,
						},
					],
				},
			});

			expect(_updateResponse.statusCode).toBe(200);
			expect(_updateResponse.json().version).toBe(1);
			expect(_updateResponse.json().shippingInfo.deliveries[index].key).toBe(
				deliveryDraft.key,
			);
		});
	});
});

describe("Order Import", () => {
	const ctMock = new CommercetoolsMock();

	beforeAll(async () => {
		await ctMock.project("dummy").unsafeAdd("product", {
			id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
			masterData: {
				// @ts-expect-error
				current: {
					name: { "nl-NL": "Dummy" },
					slug: { "nl-NL": "Dummy" },
					categories: [],
					masterVariant: {
						id: 0,
						sku: "MYSKU",
					},
					variants: [],
				},
			},
		});
	});

	test("Import", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/import",
			payload: {
				orderNumber: "100000001",
				totalPrice: {
					centAmount: 1000,
					currencyCode: "EUR",
				},
				customLineItems: [
					{
						name: {
							"nl-NL": "Something",
						},
						slug: "my-slug",
						money: {
							centAmount: 1475,
							currencyCode: "EUR",
						},
						quantity: 1,
						// custom: {
						//   type: {
						//     typeId: 'type',
						//     key: 'myCustomLineItem',
						//   },
						//   fields: {
						//     myCustomField: 'myCustomValeu',
						//   },
						// },
					},
				],
				lineItems: [
					{
						id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
						productId: "PRODUCTID",
						name: {
							"en-US": "The product",
						},
						productType: {
							typeId: "product-type",
							id: "109caecb-abe6-4900-ab03-7af5af985ff3",
							version: 1,
						},
						variant: {
							id: 1,
							sku: "MYSKU",
							key: "MYKEY",
							prices: [
								{
									value: {
										type: "centPrecision",
										currencyCode: "EUR",
										centAmount: 14900,
										fractionDigits: 2,
									},
									id: "87943be5-c7e6-44eb-b867-f127f94ccfe7",
									country: "NL",
									// channel: {
									//   typeId: 'channel',
									//   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
									// },
									// custom: {
									//   type: {
									//     typeId: 'type',
									//     id: '55071385-b6e4-44c4-8c4b-6f2ec0f23649',
									//   },
									//   fields: {},
									// },
								},
							],
							images: [],
							attributes: [],
							assets: [],
						},
						price: {
							value: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 14900,
								fractionDigits: 2,
							},
							id: "87943be5-c7e6-44eb-b867-f127f94ccfe7",
							country: "NL",
							// channel: {
							//   typeId: 'channel',
							//   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
							// },
							// custom: {
							//   type: {
							//     typeId: 'type',
							//     id: '55071385-b6e4-44c4-8c4b-6f2ec0f23649',
							//   },
							//   fields: {},
							// },
						},
						quantity: 3,
						discountedPricePerQuantity: [],
						// distributionChannel: {
						//   typeId: 'channel',
						//   id: '411485eb-7875-46f4-8d40-1db9e61374ed',
						// },
						taxRate: {
							name: "21% BTW",
							amount: 0.21,
							includedInPrice: true,
							country: "NL",
							id: "Z0wLUuYw",
							subRates: [],
						},
						addedAt: "2020-12-08T09:10:27.085Z",
						lastModifiedAt: "2020-12-08T09:10:27.085Z",
						// state: [
						//   {
						//     quantity: 3,
						//     state: {
						//       typeId: 'state',
						//       id: 'f1d9531d-41f0-46a7-82f2-c4b0748aa9f5',
						//     },
						//   },
						// ],
						priceMode: "Platform",
						totalPrice: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 44700,
							fractionDigits: 2,
						},
						taxedPrice: {
							totalNet: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 36942,
								fractionDigits: 2,
							},
							totalGross: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 44700,
								fractionDigits: 2,
							},
						},
						lineItemMode: "Standard",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);

		const created: Order = response.json();
		expect(created.lineItems).toHaveLength(1);
		expect(created.customLineItems).toHaveLength(1);
	});
});
