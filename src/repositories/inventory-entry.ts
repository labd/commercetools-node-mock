import type {
  InventoryEntry,
  InventoryEntryChangeQuantityAction,
  InventoryEntryDraft,
  InventoryEntrySetCustomFieldAction,
  InventoryEntrySetCustomTypeAction,
  InventoryEntrySetExpectedDeliveryAction,
  InventoryEntrySetRestockableInDaysAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, type RepositoryContext } from './abstract.js'
import { createCustomFields } from './helpers.js'

export class InventoryEntryRepository extends AbstractResourceRepository<'inventory-entry'> {
  getTypeId() {
    return 'inventory-entry' as const
  }

  create(
    context: RepositoryContext,
    draft: InventoryEntryDraft
  ): InventoryEntry {
    const resource: InventoryEntry = {
      ...getBaseResourceProperties(),
      sku: draft.sku,
      quantityOnStock: draft.quantityOnStock,
      availableQuantity: draft.quantityOnStock,
      expectedDelivery: draft.expectedDelivery,
      restockableInDays: draft.restockableInDays,
      supplyChannel: {
        ...draft.supplyChannel,
        typeId: 'channel',
        id: draft.supplyChannel?.id ?? '',
      },
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.saveNew(context, resource)
    return resource
  }

  actions = {
    changeQuantity: (
      context: RepositoryContext,
      resource: Writable<InventoryEntry>,
      { quantity }: InventoryEntryChangeQuantityAction
    ) => {
      resource.quantityOnStock = quantity
      // don't know active reservations so just set to same value
      resource.availableQuantity = quantity
    },
    setExpectedDelivery: (
      context: RepositoryContext,
      resource: Writable<InventoryEntry>,
      { expectedDelivery }: InventoryEntrySetExpectedDeliveryAction
    ) => {
      resource.expectedDelivery = new Date(expectedDelivery!).toISOString()
    },
    setCustomField: (
      context: RepositoryContext,
      resource: InventoryEntry,
      { name, value }: InventoryEntrySetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
    setCustomType: (
      context: RepositoryContext,
      resource: Writable<InventoryEntry>,
      { type, fields }: InventoryEntrySetCustomTypeAction
    ) => {
      if (!type) {
        resource.custom = undefined
      } else {
        const resolvedType = this._storage.getByResourceIdentifier(
          context.projectKey,
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
          fields: fields || {},
        }
      }
    },
    setRestockableInDays: (
      context: RepositoryContext,
      resource: Writable<InventoryEntry>,
      { restockableInDays }: InventoryEntrySetRestockableInDaysAction
    ) => {
      resource.restockableInDays = restockableInDays
    },
  }
}
