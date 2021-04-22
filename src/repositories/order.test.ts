import assert from 'assert'
import { Order, OrderImportDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import { OrderRepository } from './order'
import { InMemoryStorage } from 'storage'

describe('Order Import', () => {
  const storage = new InMemoryStorage()
  const repository = new OrderRepository(storage)

  test('import exiting product', async () => {
    storage.add('dummy', 'product', {
      id: '15fc56ba-a74e-4cf8-b4b0-bada5c101541',
        // @ts-ignore
      masterData: {
        // @ts-ignore
        current: {
          name: { 'nl-NL': "Dummy"},
          slug: { 'nl-NL': "Dummy"},
          categories: [],
          masterVariant: {
            id: 0,
            sku: "MYSKU",
          },
          variants: [],
        },
      },
    })

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
})
