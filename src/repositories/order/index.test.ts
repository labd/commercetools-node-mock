import type {
	Cart,
	LineItem,
	OrderImportDraft,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { OrderRepository } from "./index";

describe("Order repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = {
		storage,
		strict: false,
	};
	const repository = new OrderRepository(config);

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
});
