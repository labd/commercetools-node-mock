import { StandalonePriceDraft } from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'

const ctMock = new CommercetoolsMock()

describe('StandalonePrice', () => {
    test('Create standalone price', async () => {
        const draft: StandalonePriceDraft = {
            sku: 'test-sku',
            value: {
                currencyCode: 'EUR',
                centAmount: 1000,
            },
            active: true,
        }

        const response = await supertest(ctMock.app).post('/dummy/standalone-prices').send(draft)
        expect(response.status).toBe(201)
    })

    test('Get standalone price', async () => {
        const draft: StandalonePriceDraft = {
            sku: 'test-sku',
            value: {
                currencyCode: 'EUR',
                centAmount: 1000,
            },
            active: true,
        }

        const createResponse = await supertest(ctMock.app).post('/dummy/standalone-prices').send(draft)

        const response = await supertest(ctMock.app).get(`/dummy/standalone-prices/${createResponse.body.id}`)
        expect(response.status).toBe(200)
    })

    test('Update standalone price', async () => {
        const draft: StandalonePriceDraft = {
            sku: 'test-sku',
            value: {
                currencyCode: 'EUR',
                centAmount: 1000,
            },
            active: true,
        }

        const createResponse = await supertest(ctMock.app).post('/dummy/standalone-prices').send(draft)

        const response = await supertest(ctMock.app)
            .post(`/dummy/standalone-prices/${createResponse.body.id}`)
            .send({
                version: createResponse.body.version,
                actions: [
                    {
                        action: 'changeValue',
                        value: {
                            currencyCode: 'EUR',
                            centAmount: 2000,
                        },
                    },
                ],
            })
        expect(response.status).toBe(200)
        expect(response.body.id).toBe(createResponse.body.id)
        expect(response.body.value.centAmount).toBe(2000)
    })
})