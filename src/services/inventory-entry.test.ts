import { InventoryEntry, Type } from '@commercetools/platform-sdk'
import assert from 'assert'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { CommercetoolsMock } from '../index'

describe('Inventory Entry Query', () => {
  const ctMock = new CommercetoolsMock()
  let inventoryEntry: InventoryEntry | undefined

  beforeEach(async () => {
    const response = await supertest(ctMock.app).post('/dummy/inventory').send({
      sku: '1337',
      quantityOnStock: 100,
    })
    expect(response.status).toBe(201)
    inventoryEntry = response.body
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('no filter', async () => {
    assert(inventoryEntry, 'inventory entry not created')

    const response = await supertest(ctMock.app).get(`/dummy/inventory`)
    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.total).toBe(1)
    expect(response.body.offset).toBe(0)
    expect(response.body.limit).toBe(20)
  })

  test('filter sku', async () => {
    assert(inventoryEntry, 'inventory entry not created')

    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/inventory`)
        .query({ where: 'sku="unknown"' })
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(0)
    }
    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/inventory`)
        .query({ where: 'sku="1337"' })
      expect(response.status).toBe(200)
      expect(response.body.count).toBe(1)
    }
  })
})

describe('Inventory Entry Update Actions', () => {
  const ctMock = new CommercetoolsMock()
  let inventoryEntry: InventoryEntry | undefined
  let customType: Type | undefined

  beforeEach(async () => {
    let response = await supertest(ctMock.app).post('/dummy/inventory').send({
      sku: '1337',
      quantityOnStock: 100,
    })
    expect(response.status).toBe(201)
    inventoryEntry = response.body

    response = await supertest(ctMock.app)
      .post('/dummy/types')
      .send({
        key: 'custom-inventory',
        name: {
          'nl-NL': 'custom-inventory',
        },
        resourceTypeIds: ['inventory-entry'],
      })
    expect(response.status).toBe(201)
    customType = response.body
  })

  test('changeQuantity', async () => {
    assert(inventoryEntry, 'inventory entry not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 1,
        actions: [{ action: 'changeQuantity', quantity: 300 }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.availableQuantity).toBe(300)
    expect(response.body.quantityOnStock).toBe(300)
  })

  test('set custom type', async () => {
    assert(inventoryEntry, 'inventory entry not created')
    assert(customType, 'custom type not created')

    const response = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'setCustomType',
            type: { typeId: 'type', id: customType.id },
          },
        ],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.custom.type.id).toBe(customType.id)
  })

  test('set expected delivery', async () => {
    assert(inventoryEntry, 'inventory entry not created')
    const expectedDelivery = '2021-04-02T15:06:19.700Z'
    const response = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setExpectedDelivery', expectedDelivery }],
      })
    expect(response.status).toBe(200)
    expect(response.body.version).toBe(2)
    expect(response.body.expectedDelivery).toBe(expectedDelivery)
  })

  test('set custom field', async () => {
    assert(inventoryEntry, 'inventory entry not created')
    assert(customType, 'custom type not created')

    const setCustomTypeResponse = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 1,
        actions: [
          {
            action: 'setCustomType',
            type: { typeId: 'type', id: customType.id },
            fields: { lol: 'bar' },
          },
        ],
      })
    expect(setCustomTypeResponse.status).toBe(200)
    expect(setCustomTypeResponse.body.custom.type.id).toBe(customType.id)

    const response = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 2,
        actions: [{ action: 'setCustomField', name: 'foo', value: 'bar' }],
      })

    expect(response.status).toBe(200)
    expect(response.body.version).toBe(3)
    expect(response.body.custom.fields['foo']).toBe('bar')
  })

  test('set restockable in days', async () => {
    assert(inventoryEntry, 'inventory entry not created')
    const response = await supertest(ctMock.app)
      .post(`/dummy/inventory/${inventoryEntry.id}`)
      .send({
        version: 1,
        actions: [{ action: 'setRestockableInDays', restockableInDays: 0 }],
      })
    expect(response.status).toEqual(200)
    expect(response.body.version).toEqual(2)
    expect(response.body.restockableInDays).toEqual(0)
  })
})
