import {
  InventoryEntry,
  InventoryEntryChangeQuantityAction,
  InventoryEntryDraft,
  InventoryEntrySetCustomFieldAction,
  InventoryEntrySetCustomTypeAction,
  InventoryEntrySetExpectedDeliveryAction,
  InventoryEntrySetRestockableInDaysAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'
import { createCustomFields } from './helpers'
import { Writable } from '../types'

export class InventoryEntryRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'inventory-entry'
  }

  create(projectKey: string, draft: InventoryEntryDraft): InventoryEntry {
    const resource: InventoryEntry = {
      ...getBaseResourceProperties(),
      sku: draft.sku,
      quantityOnStock: draft.quantityOnStock,
      availableQuantity: draft.quantityOnStock,
      expectedDelivery: draft.expectedDelivery,
      restockableInDays: draft.restockableInDays,
      supplyChannel: draft.supplyChannel,
      custom: createCustomFields(draft.custom, projectKey, this._storage),
    }
    this.save(projectKey, resource)
    return resource
  }

  actions = {
    changeQuantity: (
      projectKey: string,
      resource: Writable<InventoryEntry>,
      { quantity }: InventoryEntryChangeQuantityAction
    ) => {
      resource.quantityOnStock = quantity
      // don't know active reservations so just set to same value
      resource.availableQuantity = quantity
    },
    setExpectedDelivery: (
      projectKey: string,
      resource: Writable<InventoryEntry>,
      { expectedDelivery }: InventoryEntrySetExpectedDeliveryAction
    ) => {
      resource.expectedDelivery = new Date(expectedDelivery!).toISOString()
    },
    setCustomField: (
      projectKey: string,
      resource: InventoryEntry,
      { name, value }: InventoryEntrySetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      projectKey: string,
      resource: Writable<InventoryEntry>,
      { type, fields }: InventoryEntrySetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          projectKey,
          type
        )
        if (!resolvedType) {
          throw new Error(`Type ${type} not found`)
        }

        resource.custom = {
          type: {
            typeId: 'type',
            id: resolvedType.id,
          },
          fields: fields || [],
        }
      }
    },
    setRestockableInDays: (
      projectKey: string,
      resource: Writable<InventoryEntry>,
      { restockableInDays }: InventoryEntrySetRestockableInDaysAction
    ) => {
      resource.restockableInDays = restockableInDays
    },
  }
}
