import {
  CartDiscountReference,
  DiscountCode,
  DiscountCodeChangeCartDiscountsAction,
  DiscountCodeChangeIsActiveAction,
  DiscountCodeDraft,
  DiscountCodeSetCartPredicateAction,
  DiscountCodeSetDescriptionAction,
  DiscountCodeSetMaxApplicationsAction,
  DiscountCodeSetMaxApplicationsPerCustomerAction,
  DiscountCodeSetNameAction,
  DiscountCodeSetValidFromAction,
  DiscountCodeSetValidFromAndUntilAction,
  DiscountCodeSetValidUntilAction,
  DiscountCodeUpdateAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class DiscountCodeRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(context: RepositoryContext, draft: DiscountCodeDraft): DiscountCode {
    const resource: DiscountCode = {
      ...getBaseResourceProperties(),
      applicationVersion: 1,
      cartDiscounts: draft.cartDiscounts.map(
        (obj): CartDiscountReference => ({
          typeId: 'cart-discount',
          id: obj.id!,
        })
      ),
      cartPredicate: draft.cartPredicate,
      code: draft.code,
      description: draft.description,
      groups: draft.groups || [],
      isActive: draft.isActive || true,
      name: draft.name,
      references: [],
      validFrom: draft.validFrom,
      validUntil: draft.validUntil,
      maxApplications: draft.maxApplications,
      maxApplicationsPerCustomer: draft.maxApplicationsPerCustomer,
    }
    this.save(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      DiscountCodeUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<DiscountCode>,
        action: any
      ) => void
    >
  > = {
    changeIsActive: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { isActive }: DiscountCodeChangeIsActiveAction
    ) => {
      resource.isActive = isActive
    },
    changeCartDiscounts: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { cartDiscounts }: DiscountCodeChangeCartDiscountsAction
    ) => {
      resource.cartDiscounts = cartDiscounts.map(
        (obj): CartDiscountReference => ({
          typeId: 'cart-discount',
          id: obj.id!,
        })
      )
    },
    setDescription: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { description }: DiscountCodeSetDescriptionAction
    ) => {
      resource.description = description
    },
    setCartPredicate: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { cartPredicate }: DiscountCodeSetCartPredicateAction
    ) => {
      resource.cartPredicate = cartPredicate
    },
    setName: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { name }: DiscountCodeSetNameAction
    ) => {
      resource.name = name
    },
    setMaxApplications: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { maxApplications }: DiscountCodeSetMaxApplicationsAction
    ) => {
      resource.maxApplications = maxApplications
    },
    setMaxApplicationsPerCustomer: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      {
        maxApplicationsPerCustomer,
      }: DiscountCodeSetMaxApplicationsPerCustomerAction
    ) => {
      resource.maxApplicationsPerCustomer = maxApplicationsPerCustomer
    },
    setValidFrom: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { validFrom }: DiscountCodeSetValidFromAction
    ) => {
      resource.validFrom = validFrom
    },
    setValidUntil: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { validUntil }: DiscountCodeSetValidUntilAction
    ) => {
      resource.validUntil = validUntil
    },
    setValidFromAndUntil: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { validFrom, validUntil }: DiscountCodeSetValidFromAndUntilAction
    ) => {
      resource.validFrom = validFrom
      resource.validUntil = validUntil
    },
  }
}
