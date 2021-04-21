import assert from 'assert'
import {
  InventoryEntry,
  InventoryEntrySetCustomFieldAction,
  InventoryEntrySetExpectedDeliveryAction,
} from '@commercetools/platform-sdk'
import supertest from 'supertest'
import { CommercetoolsMock } from '../index'
import { Writable } from '../types'

describe('Inventory Entry Query', () => {
  const ctMock = new CommercetoolsMock()
  let inventoryEntry: InventoryEntry | undefined

  beforeEach(async () => {
    let response = await supertest(ctMock.app)
      .post('/dummy/inventory')
      .send({
        sku: '1337',
        quantityOnStock: 100,
      })
    expect(response.status).toBe(200)
    inventoryEntry = response.body
  })

  afterEach(() => {
    ctMock.clear()
  })

  test('no filter', async () => {
    assert(inventoryEntry)

    const response = await supertest(ctMock.app).get(`/dummy/inventory`)
    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.total).toBe(1)
    expect(response.body.offset).toBe(0)
    expect(response.body.limit).toBe(20)
  })

  test('filter sku', async () => {
    assert(inventoryEntry)

    {
      const response = await supertest(ctMock.app)
        .get(`/dummy/inventory`)
        .query({ where: 'sku=unknown' })
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

  beforeEach(async () => {
    let response = await supertest(ctMock.app)
      .post('/dummy/inventory')
      .send({
        sku: '1337',
        quantityOnStock: 100,
      })
    expect(response.status).toBe(200)
    inventoryEntry = response.body
  })

  test('changeQuantity', async () => {
    assert(inventoryEntry)

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
})
