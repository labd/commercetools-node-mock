import {
  ProductDiscount,
  ProductDiscountChangeIsActiveAction,
  ProductDiscountChangeNameAction,
  ProductDiscountChangePredicateAction,
  ProductDiscountChangeSortOrderAction,
  ProductDiscountChangeValueAction,
  ProductDiscountDraft,
  ProductDiscountSetDescriptionAction,
  ProductDiscountSetKeyAction,
  ProductDiscountSetValidFromAction,
  ProductDiscountSetValidFromAndUntilAction,
  ProductDiscountSetValidUntilAction,
  ProductDiscountUpdateAction,
  ProductDiscountValue,
  ProductDiscountValueAbsolute,
  ProductDiscountValueDraft,
  ProductDiscountValueExternal,
  ProductDiscountValueRelative,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { createTypedMoney } from './helpers'

export class ProductDiscountRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'product-discount'
  }

  create(
    context: RepositoryContext,
    draft: ProductDiscountDraft
  ): ProductDiscount {
    const resource: ProductDiscount = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      description: draft.description,
      value: this.transformValueDraft(draft.value),
      predicate: draft.predicate,
      sortOrder: draft.sortOrder,
      isActive: draft.isActive || false,
      validFrom: draft.validFrom,
      validUntil: draft.validUntil,
      references: [],
    }
    this.save(context, resource)
    return resource
  }

  private transformValueDraft(
    value: ProductDiscountValueDraft
  ): ProductDiscountValue {
    switch (value.type) {
      case 'absolute': {
        return {
          type: 'absolute',
          money: value.money.map(createTypedMoney),
        } as ProductDiscountValueAbsolute
      }
      case 'external': {
        return {
          type: 'external',
        } as ProductDiscountValueExternal
      }
      case 'relative': {
        return {
          ...value,
        } as ProductDiscountValueRelative
      }
    }
  }

  getWithKey(
    context: RepositoryContext,
    key: string
  ): ProductDiscount | undefined {
    const result = this._storage.query(context.projectKey, this.getTypeId(), {
      where: [`key="${key}"`],
    })
    if (result.count === 1) {
      return result.results[0] as ProductDiscount
    }

    // Catch this for now, should be checked when creating/updating
    if (result.count > 1) {
      throw new Error('Duplicate product discount key')
    }

    return
  }

  actions: Partial<
    Record<
      ProductDiscountUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<ProductDiscount>,
        action: any
      ) => void
    >
  > = {
    setKey: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { key }: ProductDiscountSetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { description }: ProductDiscountSetDescriptionAction
    ) => {
      if (description && Object.keys(description).length > 0) {
        resource.description = description
      } else {
        resource.description = undefined
      }
    },
    changeName: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { name }: ProductDiscountChangeNameAction
    ) => {
      resource.name = name
    },
    changeValue: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { value }: ProductDiscountChangeValueAction
    ) => {
      resource.value = this.transformValueDraft(value)
    },
    changePredicate: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { predicate }: ProductDiscountChangePredicateAction
    ) => {
      resource.predicate = predicate
    },
    changeSortOrder: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { sortOrder }: ProductDiscountChangeSortOrderAction
    ) => {
      resource.sortOrder = sortOrder
    },
    changeIsActive: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { isActive }: ProductDiscountChangeIsActiveAction
    ) => {
      resource.isActive = isActive
    },
    setValidFrom: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { validFrom }: ProductDiscountSetValidFromAction
    ) => {
      resource.validFrom = validFrom
    },
    setValidUntil: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { validUntil }: ProductDiscountSetValidUntilAction
    ) => {
      resource.validUntil = validUntil
    },
    setValidFromAndUntil: (
      context: RepositoryContext,
      resource: Writable<ProductDiscount>,
      { validFrom, validUntil }: ProductDiscountSetValidFromAndUntilAction
    ) => {
      resource.validFrom = validFrom
      resource.validUntil = validUntil
    },
  }
}
