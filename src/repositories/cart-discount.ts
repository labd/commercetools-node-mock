import {
  CartDiscount,
  CartDiscountChangeIsActiveAction,
  CartDiscountChangeSortOrderAction,
  CartDiscountDraft,
  CartDiscountSetDescriptionAction,
  CartDiscountSetKeyAction,
  CartDiscountSetValidFromAction,
  CartDiscountSetValidFromAndUntilAction,
  CartDiscountSetValidUntilAction,
  CartDiscountUpdateAction,
  CartDiscountValueAbsolute,
  CartDiscountValueDraft,
  CartDiscountValueFixed,
  CartDiscountValueGiftLineItem,
  CartDiscountValueRelative,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { createTypedMoney } from './helpers'

export class CartDiscountRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(context: RepositoryContext, draft: CartDiscountDraft): CartDiscount {
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
    this.save(context, resource)
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

  actions: Partial<
    Record<
      CartDiscountUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<CartDiscount>,
        action: any
      ) => void
    >
  > = {
    setKey: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { key }: CartDiscountSetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { description }: CartDiscountSetDescriptionAction
    ) => {
      resource.description = description
    },
    setValidFrom: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { validFrom }: CartDiscountSetValidFromAction
    ) => {
      resource.validFrom = validFrom
    },
    setValidUntil: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { validUntil }: CartDiscountSetValidUntilAction
    ) => {
      resource.validUntil = validUntil
    },
    setValidFromAndUntil: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { validFrom, validUntil }: CartDiscountSetValidFromAndUntilAction
    ) => {
      resource.validFrom = validFrom
      resource.validUntil = validUntil
    },
    changeSortOrder: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { sortOrder }: CartDiscountChangeSortOrderAction
    ) => {
      resource.sortOrder = sortOrder
    },
    changeIsActive: (
      context: RepositoryContext,
      resource: Writable<CartDiscount>,
      { isActive }: CartDiscountChangeIsActiveAction
    ) => {
      resource.isActive = isActive
    },
  }
}
