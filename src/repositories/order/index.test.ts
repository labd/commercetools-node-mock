import { beforeEach } from "node:test";
import type {
	Cart,
	LineItem,
	Order,
	OrderImportDraft,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import { InMemoryStorage } from "~src/storage";
import { OrderRepository } from "./index";

describe("Order repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = {
		storage,
		strict: false,
	};
	const repository = new OrderRepository(config);

	beforeEach(() => {
		storage.clear();
	});

	test("create from cart", async () => {
		const cart: Cart = {
			id: "b3875a58-4ab2-4aaa-b399-184ce7561c27",
			version: 1,
			createdAt: "2021-09-02T12:23:30.036Z",
			lastModifiedAt: "2021-09-02T12:23:30.546Z",
			discountCodes: [],
			directDiscounts: [],
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems: [
				{
					id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
					productId: "PRODUCTID",
					variantId: 1,
					quantity: 1,
				} as unknown as LineItem,
			],
			customLineItems: [],
			priceRoundingMode: "HalfEven",
			totalPrice: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 10000,
				fractionDigits: 2,
			},
			cartState: "Active",
			shippingMode: "Single",
			shipping: [],
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "UnitPriceLevel",
			refusedGifts: [],
			origin: "Customer",
			anonymousId: "1234567890",
			billingAddress: {
				id: "1234567890",
				country: "NL",
				firstName: "John",
				lastName: "Doe",
				streetName: "Main Street",
				streetNumber: "123",
				postalCode: "123456",
			},
			customerEmail: "john.doe@example.com",
			customerGroup: {
				id: "1234567890",
				typeId: "customer-group",
			},
			customerId: "1234567890",
			custom: {
				type: {
					typeId: "type",
					id: "1234567890",
				},
				fields: {
					description: "example description",
				},
			},

			shippingAddress: {
				id: "1234567890",
				country: "NL",
				firstName: "John",
				lastName: "Doe",
				streetName: "Main Street",
				streetNumber: "123",
				postalCode: "123456",
			},
			shippingInfo: {
				shippingMethodName: "Standard Shipping",
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1000,
					fractionDigits: 2,
				},
				shippingRate: {
					price: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 1000,
						fractionDigits: 2,
					},
					tiers: [],
				},
				shippingMethodState: "Shipped",
			},
			taxedPrice: {
				totalNet: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1000,
					fractionDigits: 2,
				},
				taxPortions: [],
				totalGross: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1210,
					fractionDigits: 2,
				},
			},
			taxedShippingPrice: {
				totalNet: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 100,
					fractionDigits: 2,
				},
				taxPortions: [],
				totalGross: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 121,
					fractionDigits: 2,
				},
			},
		};

		storage.add("dummy", "cart", cart);
		const ctx = { projectKey: "dummy" };

		const result = repository.create(ctx, {
			cart: {
				id: cart.id,
				typeId: "cart",
			},
			version: cart.version,
		});
		expect(result.cart?.id).toBe(cart.id);

		const items = repository.query(ctx);
		expect(items.count).toBe(1);

		expect(result.orderNumber).not.toBeUndefined();
		expect(result.anonymousId).toEqual(cart.anonymousId);
		expect(result.billingAddress).toEqual(cart.billingAddress);
		expect(result.cart?.id).toEqual(cart.id);
		expect(result.country).toEqual(cart.country);
		expect(result.custom).toEqual(cart.custom);
		expect(result.customerEmail).toEqual(cart.customerEmail);
		expect(result.customerGroup).toEqual(cart.customerGroup);
		expect(result.customerId).toEqual(cart.customerId);
		expect(result.customLineItems).toEqual(cart.customLineItems);
		expect(result.directDiscounts).toEqual(cart.directDiscounts);
		expect(result.discountCodes).toEqual(cart.discountCodes);
		expect(result.discountOnTotalPrice).toEqual(cart.discountOnTotalPrice);
		expect(result.lineItems).toEqual(cart.lineItems);
		expect(result.locale).toEqual(cart.locale);
		expect(result.orderState).toEqual("Open");
		expect(result.origin).toEqual(cart.origin);
		expect(result.paymentInfo).toEqual(cart.paymentInfo);
		expect(result.refusedGifts).toEqual(cart.refusedGifts);
		expect(result.shipping).toEqual(cart.shipping);
		expect(result.shippingAddress).toEqual(cart.shippingAddress);
		expect(result.shippingMode).toEqual(cart.shippingMode);
		expect(result.syncInfo).toEqual([]);
		expect(result.taxCalculationMode).toEqual(cart.taxCalculationMode);
		expect(result.taxedPrice).toEqual(cart.taxedPrice);
		expect(result.taxedShippingPrice).toEqual(cart.taxedShippingPrice);
		expect(result.taxMode).toEqual(cart.taxMode);
		expect(result.taxRoundingMode).toEqual(cart.taxRoundingMode);
		expect(result.totalPrice).toEqual(cart.totalPrice);
		expect(result.store).toEqual(cart.store);
		// Test that shippingInfo is copied from cart to order
		expect(result.shippingInfo).toEqual(cart.shippingInfo);
	});

	test("should calculate taxed price when creating order from cart", () => {
		const cart: Cart = {
			...getBaseResourceProperties(),
			id: "cart-with-taxed-items",
			version: 1,
			cartState: "Active",
			lineItems: [
				{
					id: "li-1",
					productId: "product-1",
					variantId: 1,
					quantity: 1,
					name: { en: "Test" },
					variant: {
						id: 1,
						sku: "TEST",
					},
					price: {
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 1000,
							fractionDigits: 2,
						},
					},
					totalPrice: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 1000,
						fractionDigits: 2,
					},
					taxedPrice: {
						totalNet: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 1000,
							fractionDigits: 2,
						},
						totalGross: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 1210,
							fractionDigits: 2,
						},
						taxPortions: [
							{
								rate: 0.21,
								amount: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 210,
									fractionDigits: 2,
								},
							},
						],
						totalTax: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 210,
							fractionDigits: 2,
						},
					},
				} as unknown as LineItem,
			],
			customLineItems: [],
			totalPrice: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			priceRoundingMode: "HalfEven",
			refusedGifts: [],
			shippingMode: "Single",
			shipping: [],
			shippingAddress: { country: "NL" },
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "LineItemLevel",
			origin: "Customer",
			itemShippingAddresses: [],
			directDiscounts: [],
			discountCodes: [],
			discountOnTotalPrice: undefined,
			inventoryMode: "None",
		};

		storage.add("dummy", "cart", cart);
		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, {
			cart: { id: cart.id, typeId: "cart" },
			version: cart.version,
		});

		expect(result.taxedPrice).toBeDefined();
		expect(result.taxedPrice?.totalNet.centAmount).toBe(1000);
		expect(result.taxedPrice?.totalGross.centAmount).toBe(1210);
		expect(result.taxedPrice?.totalTax?.centAmount).toBe(210);
	});

	test("create order in store", async () => {
		storage.add("dummy", "store", {
			...getBaseResourceProperties(),
			id: "store-123",
			key: "testStore",
			name: { "en-US": "Test Store" },
			countries: [{ code: "NL" }],
			languages: ["en-US"],
			distributionChannels: [],
			supplyChannels: [],
			productSelections: [],
		});

		storage.add("dummy", "business-unit", {
			...getBaseResourceProperties(),
			id: "business-unit-123",
			unitType: "Company",
			key: "test-business-unit",
			status: "Active",
			storeMode: "Explicit",
			name: "Test Business Unit",
			addresses: [],
			associateMode: "Explicit",
			associates: [],
			topLevelUnit: {
				typeId: "business-unit",
				key: "test-business-unit",
			},
			approvalRuleMode: "Explicit",
		});

		storage.add("dummy", "customer", {
			...getBaseResourceProperties(),
			id: "customer-123",
			email: "test@example.com",
			firstName: "John",
			lastName: "Doe",
			password: "hashed-password",
			addresses: [],
			defaultShippingAddressId: "",
			defaultBillingAddressId: "",
			customerNumber: "CUST-001",
			externalId: "",
			key: "test-customer",
			stores: [],
			isEmailVerified: true,
			authenticationMode: "Password" as const,
		});

		const draft: OrderImportDraft = {
			orderNumber: "100000002",
			totalPrice: {
				centAmount: 1000,
				currencyCode: "EUR",
			},
			paymentState: "Paid",
			customLineItems: [],
			lineItems: [],
			store: {
				typeId: "store",
				key: "testStore",
			},
			businessUnit: {
				typeId: "business-unit",
				key: "test-business-unit",
			},
			customerId: "customer-123",
		};

		const ctx = { projectKey: "dummy", storeKey: "testStore" };
		const result = repository.import(ctx, draft);

		expect(result.orderNumber).toBe("100000002");
		expect(result.store?.key).toBe("testStore");
		expect(result.businessUnit?.key).toBe("test-business-unit");
		expect(result.customerId).toBe("customer-123");
		expect(result.totalPrice.centAmount).toBe(1000);
		expect(result.totalPrice.currencyCode).toBe("EUR");
		expect(result.orderState).toBe("Open");
		expect(result.paymentState).toBe("Paid");
	});

	test("should calculate taxed price when importing order", () => {
		storage.add("dummy", "product", {
			...getBaseResourceProperties(),
			id: "product-import",
			productType: {
				typeId: "product-type",
				id: "product-type-id",
			},
			masterData: {
				current: {
					name: { en: "Imported" },
					slug: { en: "imported" },
					categories: [],
					masterVariant: {
						id: 1,
						sku: "IMPORT-SKU",
						prices: [],
						attributes: [],
					},
					variants: [],
					searchKeywords: {},
					attributes: [],
				},
				staged: {
					name: { en: "Imported" },
					slug: { en: "imported" },
					categories: [],
					masterVariant: {
						id: 1,
						sku: "IMPORT-SKU",
						prices: [],
						attributes: [],
					},
					variants: [],
					searchKeywords: {},
					attributes: [],
				},
				published: false,
				hasStagedChanges: false,
			},
		});

		const draft: OrderImportDraft = {
			orderNumber: "IMPORT-ORDER-1",
			totalPrice: {
				centAmount: 1000,
				currencyCode: "EUR",
			},
			lineItems: [
				{
					name: { en: "Imported" },
					variant: {
						sku: "IMPORT-SKU",
					},
					price: {
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 1000,
							fractionDigits: 2,
						},
					},
					quantity: 1,
					taxRate: {
						name: "Standard VAT",
						amount: 0.21,
						includedInPrice: false,
						country: "NL",
						id: "import-tax-rate",
						subRates: [],
					},
				},
			],
			customLineItems: [],
		};

		const result = repository.import({ projectKey: "dummy" }, draft);
		expect(result.taxedPrice).toBeDefined();
		expect(result.taxedPrice?.totalNet.centAmount).toBe(1000);
		expect(result.taxedPrice?.totalGross.centAmount).toBe(1210);
		expect(result.taxedPrice?.totalTax?.centAmount).toBe(210);
	});

	test("import exiting product", async () => {
		storage.add("dummy", "product", {
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

		const draft: OrderImportDraft = {
			orderNumber: "100000001",
			totalPrice: {
				centAmount: 1000,
				currencyCode: "EUR",
			},
			paymentState: "Paid",
			customLineItems: [],
			lineItems: [
				{
					productId: "PRODUCTID",
					name: {
						"en-US": "The product",
					},
					variant: {
						id: 1,
						sku: "MYSKU",
						prices: [
							{
								value: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 14900,
									fractionDigits: 2,
								},
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
					},
					price: {
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 14900,
							fractionDigits: 2,
						},
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
					// state: [
					//   {
					//     quantity: 3,
					//     state: {
					//       typeId: 'state',
					//       id: 'f1d9531d-41f0-46a7-82f2-c4b0748aa9f5',
					//     },
					//   },
					// ],
				},
			],
		};

		repository.import({ projectKey: "dummy" }, draft);
	});
	/*
  test('import non exiting product', async () => {
	const draft: OrderImportDraft = {
	  orderNumber: '100000001',
	  totalPrice: {
		centAmount: 1000,
		currencyCode: 'EUR',
	  },
	  customLineItems: [],
	  lineItems: [
		{
		  id: '15fc56ba-a74e-4cf8-b4b0-bada5c101541',
		  productId: 'PRODUCTID',
		  name: {
			'en-US': 'The product',
		  },
		  productType: {
			typeId: 'product-type',
			id: '109caecb-abe6-4900-ab03-7af5af985ff3',
			// @ts-ignore
			version: 1,
		  },
		  variant: {
			id: 1,
			sku: 'MYSKU',
			key: 'MYKEY',
			prices: [
			  {
				value: {
				  // @ts-ignore
				  type: 'centPrecision',
				  currencyCode: 'EUR',
				  centAmount: 14900,
				  fractionDigits: 2,
				},
				id: '87943be5-c7e6-44eb-b867-f127f94ccfe7',
				country: 'NL',
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
			  // @ts-ignore
			  type: 'centPrecision',
			  currencyCode: 'EUR',
			  centAmount: 14900,
			  fractionDigits: 2,
			},
			id: '87943be5-c7e6-44eb-b867-f127f94ccfe7',
			country: 'NL',
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
			name: '21% BTW',
			amount: 0.21,
			includedInPrice: true,
			country: 'NL',
			id: 'Z0wLUuYw',
			subRates: [],
		  },
		  addedAt: '2020-12-08T09:10:27.085Z',
		  lastModifiedAt: '2020-12-08T09:10:27.085Z',
		  // state: [
		  //   {
		  //     quantity: 3,
		  //     state: {
		  //       typeId: 'state',
		  //       id: 'f1d9531d-41f0-46a7-82f2-c4b0748aa9f5',
		  //     },
		  //   },
		  // ],
		  priceMode: 'Platform',
		  totalPrice: {
			type: 'centPrecision',
			currencyCode: 'EUR',
			centAmount: 44700,
			fractionDigits: 2,
		  },
		  taxedPrice: {
			totalNet: {
			  type: 'centPrecision',
			  currencyCode: 'EUR',
			  centAmount: 36942,
			  fractionDigits: 2,
			},
			totalGross: {
			  type: 'centPrecision',
			  currencyCode: 'EUR',
			  centAmount: 44700,
			  fractionDigits: 2,
			},
		  },
		  lineItemMode: 'Standard',
		},
	  ],
	}

	repository.import('dummy', draft)
  })
  */

	describe("shippingInfo functionality", () => {
		test("createShippingInfo creates basic shipping info", () => {
			// Create a zone for Netherlands
			const zone = {
				...getBaseResourceProperties(),
				id: "zone-nl",
				name: "Netherlands Zone",
				locations: [
					{
						country: "NL",
					},
				],
			};

			// Create a shipping method first
			const shippingMethod = {
				...getBaseResourceProperties(),
				id: "shipping-method-123",
				name: "Express Shipping",
				active: true,
				isDefault: false,
				taxCategory: {
					typeId: "tax-category" as const,
					id: "tax-category-123",
				},
				zoneRates: [
					{
						zone: {
							typeId: "zone" as const,
							id: "zone-nl",
							obj: zone,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision" as const,
									currencyCode: "EUR",
									centAmount: 500,
									fractionDigits: 2,
								},
								tiers: [],
							},
						],
					},
				],
			};

			const taxCategory = {
				...getBaseResourceProperties(),
				id: "tax-category-123",
				name: "Standard Tax",
				rates: [
					{
						name: "Standard VAT",
						amount: 0.21,
						country: "NL",
						includedInPrice: true,
					},
				],
			};

			storage.add("dummy", "zone", zone);
			storage.add("dummy", "shipping-method", shippingMethod);
			storage.add("dummy", "tax-category", taxCategory);

			const order: Order = {
				...getBaseResourceProperties(),
				orderNumber: "order-123",
				orderState: "Open",
				origin: "Customer",
				customLineItems: [],
				lineItems: [],
				totalPrice: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1000,
					fractionDigits: 2,
				},
				lastMessageSequenceNumber: 0,
				refusedGifts: [],
				shipping: [],
				shippingMode: "Single",
				shippingAddress: {
					id: "address-123",
					country: "NL",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "123",
					postalCode: "1234AB",
					city: "Amsterdam",
				},
				syncInfo: [],
				taxCalculationMode: "UnitPriceLevel",
				taxMode: "Platform",
				taxRoundingMode: "HalfEven",
			};

			const ctx = { projectKey: "dummy" };
			const result = repository.createShippingInfo(ctx, order, {
				typeId: "shipping-method",
				id: "shipping-method-123",
			});

			expect(result).toBeDefined();
			expect(result.shippingMethod?.id).toBe("shipping-method-123");
			expect(result.shippingMethodName).toBe("Express Shipping");
			expect(result.price.currencyCode).toBe("EUR");
			expect(result.price.centAmount).toBe(500);
			expect(result.shippingMethodState).toBe("MatchesCart");
			expect(result.deliveries).toEqual([]);
			expect(result.taxCategory?.id).toBe("tax-category-123");
		});

		test("import order with shippingInfo", () => {
			// Create required resources
			const zone = {
				...getBaseResourceProperties(),
				id: "zone-de",
				name: "Germany Zone",
				locations: [
					{
						country: "DE",
					},
				],
			};

			const shippingMethod = {
				...getBaseResourceProperties(),
				id: "shipping-method-456",
				name: "Standard Shipping",
				active: true,
				isDefault: false,
				taxCategory: {
					typeId: "tax-category" as const,
					id: "tax-category-456",
				},
				zoneRates: [
					{
						zone: {
							typeId: "zone" as const,
							id: "zone-de",
							obj: zone,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision" as const,
									currencyCode: "EUR",
									centAmount: 500,
									fractionDigits: 2,
								},
								tiers: [],
							},
						],
					},
				],
			};

			const taxCategory = {
				...getBaseResourceProperties(),
				id: "tax-category-456",
				name: "Standard Tax",
				rates: [
					{
						name: "Standard VAT",
						amount: 0.19,
						country: "DE",
						includedInPrice: true,
					},
				],
			};

			storage.add("dummy", "zone", zone);
			storage.add("dummy", "shipping-method", shippingMethod);
			storage.add("dummy", "tax-category", taxCategory);

			const draft: OrderImportDraft = {
				orderNumber: "imported-order-123",
				totalPrice: {
					currencyCode: "EUR",
					centAmount: 2000,
				},
				shippingAddress: {
					country: "DE",
					firstName: "Max",
					lastName: "Mustermann",
					streetName: "Hauptstraße",
					streetNumber: "1",
					postalCode: "10115",
					city: "Berlin",
				},
				shippingInfo: {
					shippingMethodName: "Standard Shipping",
					price: {
						currencyCode: "EUR",
						centAmount: 500,
					},
					shippingRate: {
						price: {
							currencyCode: "EUR",
							centAmount: 500,
						},
						tiers: [],
					},
					shippingMethod: {
						typeId: "shipping-method",
						id: "shipping-method-456",
					},
					taxCategory: {
						typeId: "tax-category",
						id: "tax-category-456",
					},
					taxRate: {
						name: "Standard VAT",
						amount: 0.19,
						country: "DE",
						includedInPrice: true,
					},
					shippingMethodState: "MatchesCart",
					deliveries: [
						{
							key: "delivery-1",
							items: [],
							parcels: [
								{
									key: "parcel-1",
									measurements: {
										heightInMillimeter: 100,
										lengthInMillimeter: 200,
										widthInMillimeter: 150,
										weightInGram: 500,
									},
									items: [],
								},
							],
						},
					],
				},
			};

			const ctx = { projectKey: "dummy" };
			const result = repository.import(ctx, draft);

			expect(result.shippingInfo).toBeDefined();
			expect(result.shippingInfo?.shippingMethodName).toBe("Standard Shipping");
			expect(result.shippingInfo?.price.centAmount).toBe(500);
			expect(result.shippingInfo?.shippingMethod?.id).toBe(
				"shipping-method-456",
			);
			expect(result.shippingInfo?.taxCategory?.id).toBe("tax-category-456");
			expect(result.shippingInfo?.taxRate?.amount).toBe(0.19);
			// Note: deliveries from import drafts are not currently supported in native implementation
			expect(result.shippingInfo?.deliveries).toEqual([]);
		});

		test("createShippingInfo throws error for non-existent shipping method", () => {
			const order: Order = {
				...getBaseResourceProperties(),
				orderNumber: "order-456",
				orderState: "Open",
				origin: "Customer",
				customLineItems: [],
				lineItems: [],
				totalPrice: {
					type: "centPrecision",
					currencyCode: "USD",
					centAmount: 1500,
					fractionDigits: 2,
				},
				lastMessageSequenceNumber: 0,
				refusedGifts: [],
				shipping: [],
				shippingMode: "Single",
				shippingAddress: {
					id: "address-456",
					country: "US",
					firstName: "Jane",
					lastName: "Smith",
					streetName: "Broadway",
					streetNumber: "456",
					postalCode: "10001",
					city: "New York",
					state: "NY",
				},
				syncInfo: [],
				taxCalculationMode: "UnitPriceLevel",
				taxMode: "Platform",
				taxRoundingMode: "HalfEven",
			};

			const ctx = { projectKey: "dummy" };

			expect(() => {
				repository.createShippingInfo(ctx, order, {
					typeId: "shipping-method",
					id: "non-existent-shipping-method",
				});
			}).toThrow(
				/The shipping method with ID 'non-existent-shipping-method' is not allowed/,
			);
		});
	});
});
