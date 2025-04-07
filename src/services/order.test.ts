import assert from "node:assert";
import type { Order, Payment, State } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateRandomString } from "~src/helpers";
import { CommercetoolsMock, getBaseResourceProperties } from "../index";

describe("Order Query", () => {
	const ctMock = new CommercetoolsMock();
	let order: Order | undefined;

	beforeEach(async () => {
		let response = await supertest(ctMock.app)
			.post("/dummy/carts")
			.send({
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
		expect(response.status).toBe(201);
		const cart = response.body;

		response = await supertest(ctMock.app)
			.post("/dummy/orders")
			.send({
				cart: {
					typeId: "cart",
					id: cart.id,
				},
				orderNumber: "foobar",
			});
		expect(response.status).toBe(201);
		order = response.body;
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no filter", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app).get("/dummy/orders");
		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);
		expect(response.body.total).toBe(1);
		expect(response.body.offset).toBe(0);
		expect(response.body.limit).toBe(20);
	});

	test("filter orderNumber", async () => {
		assert(order, "order not created");

		{
			const response = await supertest(ctMock.app)
				.get("/dummy/orders")
				.query({ where: 'orderNumber="nomatch"' });
			expect(response.status).toBe(200);
			expect(response.body.count).toBe(0);
		}
		{
			const response = await supertest(ctMock.app)
				.get("/dummy/orders")
				.query({ where: 'orderNumber="foobar"' });
			expect(response.status).toBe(200);
			expect(response.body.count).toBe(1);
		}
	});

	test("expand payment without payments", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.get(`/dummy/orders/${order.id}`)
			.query({ expand: "paymentInfo.payments[*].paymentStatus.state" });

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(order.id);
	});
});

describe("Order payment tests", () => {
	const ctMock = new CommercetoolsMock({
		defaultProjectKey: "dummy",
	});

	afterEach(() => {
		ctMock.clear();
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

		ctMock.project().add("state", state);
		ctMock.project().add("payment", payment);
		ctMock.project().add("order", order);

		const response = await supertest(ctMock.app)
			.get("/dummy/orders")
			.query({ where: `paymentInfo(payments(id="${payment.id}"))` });

		expect(response.status).toBe(200);
		expect(response.body.results[0].id).toBe(order.id);

		{
			const response = await supertest(ctMock.app)
				.get("/dummy/orders")
				.query({ where: "paymentInfo(payments(id is defined))" });

			expect(response.status).toBe(200);
			expect(response.body.results[0].id).toBe(order.id);
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

		ctMock.project().add("state", state);
		ctMock.project().add("payment", payment);
		ctMock.project().add("order", order);

		const response = await supertest(ctMock.app)
			.get(`/dummy/orders/order-number=${order.orderNumber}`)
			.query({ expand: "paymentInfo.payments[*].paymentStatus.state" });

		expect(response.status).toBe(200);
		expect(response.body.id).toBe(order.id);
		const maybePayment = response.body.paymentInfo.payments[0].obj;
		expect(maybePayment).toBeDefined();
		expect(maybePayment.paymentStatus.state.obj).toBeDefined();
	});
});

describe("Order Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	let order: Order | undefined;

	beforeEach(async () => {
		let response = await supertest(ctMock.app).post("/dummy/carts").send({
			currency: "EUR",
		});
		expect(response.status).toBe(201);
		const cart = response.body;

		response = await supertest(ctMock.app)
			.post("/dummy/orders")
			.send({
				cart: {
					typeId: "cart",
					id: cart.id,
				},
			});
		expect(response.status).toBe(201);
		order = response.body;
	});

	test("no update", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.locale).toBe("nl-NL");

		const responseAgain = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 2,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			});
		expect(responseAgain.status).toBe(200);
		expect(responseAgain.body.version).toBe(2);
		expect(responseAgain.body.locale).toBe("nl-NL");
	});

	test("setCustomerEmail", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [{ action: "setCustomerEmail", email: "john@doe.com" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.customerEmail).toBe("john@doe.com");
	});

	test("setCustomerId", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomerId",
						customerId: "9e3479fc-cc92-4d10-820a-a080b45ddcc1",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.customerId).toBe(
			"9e3479fc-cc92-4d10-820a-a080b45ddcc1",
		);
	});

	test("setOrderNumber", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [{ action: "setOrderNumber", orderNumber: "5000123" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.orderNumber).toBe("5000123");
	});

	test("setPurchaseOrderNumber", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setPurchaseOrderNumber", purchaseOrderNumber: "abc123" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.purchaseOrderNumber).toBe("abc123");
	});

	test("changeOrderState", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeOrderState", orderState: "Complete" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.orderState).toBe("Complete");
	});

	test("changePaymentState | changeOrderState", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "changeOrderState", orderState: "Cancelled" },
					{ action: "changePaymentState", paymentState: "Failed" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.orderState).toBe("Cancelled");
		expect(response.body.paymentState).toBe("Failed");
	});

	test("changeShipmentState", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeShipmentState", shipmentState: "Delayed" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.shipmentState).toBe("Delayed");
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
		ctMock.project("dummy").add("order", order);

		const response = await supertest(ctMock.app).get(
			`/dummy/orders/order-number=${order.orderNumber}`,
		);

		// check if status is set
		const _updateResponse = await supertest(ctMock.app)
			.post(`/dummy/orders/${response.body.id}`)
			.send({
				version: 0,
				actions: [
					{
						action: "setDeliveryCustomField",
						deliveryId: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "status",
						value: "delayed",
					},
				],
			});
		expect(_updateResponse.status).toBe(200);
		expect(_updateResponse.body.version).toBe(1);
		expect(
			_updateResponse.body.shippingInfo.deliveries[0].custom.fields.status,
		).toBe("delayed");

		// check if other field can be set
		const _updateResponse2 = await supertest(ctMock.app)
			.post(`/dummy/orders/${response.body.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setDeliveryCustomField",
						deliveryId: "6a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "carrier",
						value: "dhl",
					},
				],
			});
		expect(_updateResponse2.status).toBe(200);
		expect(_updateResponse2.body.version).toBe(2);
		expect(
			_updateResponse2.body.shippingInfo.deliveries[0].custom.fields.carrier,
		).toBe("dhl");
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
		ctMock.project("dummy").add("order", order);

		const response = await supertest(ctMock.app).get(
			`/dummy/orders/order-number=${order.orderNumber}`,
		);

		// check if status is set
		const _updateResponse = await supertest(ctMock.app)
			.post(`/dummy/orders/${response.body.id}`)
			.send({
				version: 0,
				actions: [
					{
						action: "setParcelCustomField",
						parcelId: "7a458cad-dd46-4f5f-8b73-debOede6a17d",
						name: "status",
						value: "delayed",
					},
				],
			});
		expect(_updateResponse.status).toBe(200);
		expect(_updateResponse.body.version).toBe(1);
		expect(
			_updateResponse.body.shippingInfo.deliveries[0].parcels[0].custom.fields
				.status,
		).toBe("delayed");
	});

	test("updateSyncInfo", async () => {
		assert(order, "order not created");

		const channelResponse = await supertest(ctMock.app)
			.post("/dummy/channels")
			.send({
				key: "order-sync",
				roles: ["OrderImport", "OrderExport"],
			});
		expect(channelResponse.status).toBe(201);
		const channel = channelResponse.body;

		const response = await supertest(ctMock.app)
			.post(`/dummy/orders/${order.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "updateSyncInfo",
						channel: { typeId: "channel", key: "order-sync" },
						externalId: "1234",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.syncInfo).toMatchObject([
			{
				channel: { typeId: "channel", id: channel.id },
				externalId: "1234",
			},
		]);
	});
});

describe("Order Import", () => {
	const ctMock = new CommercetoolsMock();
	ctMock.project("dummy").add("product", {
		id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
		// @ts-ignore
		masterData: {
			// @ts-ignore
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

	test("Import", async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/orders/import")
			.send({
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
							// @ts-ignore
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
			});

		expect(response.status).toBe(200);

		const created: Order = response.body;
		expect(created.lineItems).toHaveLength(1);
		expect(created.customLineItems).toHaveLength(1);
	});
});
