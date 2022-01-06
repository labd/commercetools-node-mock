import {
  CartDiscount,
  CartDiscountChangeIsActiveAction,
  CartDiscountChangeSortOrderAction,
  CartDiscountDraft,
  CartDiscountSetDescriptionAction,
  CartDiscountSetKeyAction,
  CartDiscountValueAbsolute,
  CartDiscountValueDraft,
  CartDiscountValueFixed,
  CartDiscountValueGiftLineItem,
  CartDiscountValueRelative,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { createTypedMoney } from './helpers'

export class CartDiscountRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(projectKey: string, draft: CartDiscountDraft): CartDiscount {
    const resource: CartDiscount = {
      ...getBaseResourceProperties(),
      key: draft.key,
      description: draft.description,
      cartPredicate: draft.cartPredicate,
      isActive: draft.isActive || false,
      name: draft.name,
      references: [],
      target: draft.target,
      requiresDiscountCode: draft.requiresDiscountCode || false,
      sortOrder: draft.sortOrder,
      stackingMode: draft.stackingMode || 'Stacking',
      validFrom: draft.validFrom,
      validUntil: draft.validUntil,
      value: this.transformValueDraft(draft.value),
    }
    this.save(projectKey, resource)
    return resource
  }

  private transformValueDraft(value: CartDiscountValueDraft) {
    switch (value.type) {
      case 'absolute': {
        return {
          type: 'absolute',
          money: value.money.map(createTypedMoney),
        } as CartDiscountValueAbsolute
      }
      case 'fixed': {
        return {
          type: 'fixed',
          money: value.money.map(createTypedMoney),
        } as CartDiscountValueFixed
      }
      case 'giftLineItem': {
        return {
          ...value,
        } as CartDiscountValueGiftLineItem
      }
      case 'relative': {
        return {
          ...value,
        } as CartDiscountValueRelative
      }
    }

    return value
  }

  actions = {
    setKey: (
      projectKey: string,
      resource: Writable<CartDiscount>,
      { key }: CartDiscountSetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      projectKey: string,
      resource: Writable<CartDiscount>,
      { description }: CartDiscountSetDescriptionAction
    ) => {
      resource.description = description
    },
    changeSortOrder: (
      projectKey: string,
      resource: Writable<CartDiscount>,
      { sortOrder }: CartDiscountChangeSortOrderAction
    ) => {
      resource.sortOrder = sortOrder
    },
    changeIsActive: (
      projectKey: string,
      resource: Writable<CartDiscount>,
      { isActive }: CartDiscountChangeIsActiveAction
    ) => {
      resource.isActive = isActive
    },
  }
}
