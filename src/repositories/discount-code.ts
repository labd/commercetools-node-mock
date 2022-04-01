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
import { AbstractResourceRepository } from './abstract'

export class DiscountCodeRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'cart-discount'
  }

  create(projectKey: string, draft: DiscountCodeDraft): DiscountCode {
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
    this.save(projectKey, resource)
    return resource
  }

  actions: Partial<
    Record<
      DiscountCodeUpdateAction['action'],
      (
        projectKey: string,
        resource: Writable<DiscountCode>,
        action: any
      ) => void
    >
  > = {
    changeIsActive: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { isActive }: DiscountCodeChangeIsActiveAction
    ) => {
      resource.isActive = isActive
    },
    changeCartDiscounts: (
      projectKey: string,
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
      projectKey: string,
      resource: Writable<DiscountCode>,
      { description }: DiscountCodeSetDescriptionAction
    ) => {
      resource.description = description
    },
    setCartPredicate: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { cartPredicate }: DiscountCodeSetCartPredicateAction
    ) => {
      resource.cartPredicate = cartPredicate
    },
    setName: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { name }: DiscountCodeSetNameAction
    ) => {
      resource.name = name
    },
    setMaxApplications: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { maxApplications }: DiscountCodeSetMaxApplicationsAction
    ) => {
      resource.maxApplications = maxApplications
    },
    setMaxApplicationsPerCustomer: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      {
        maxApplicationsPerCustomer,
      }: DiscountCodeSetMaxApplicationsPerCustomerAction
    ) => {
      resource.maxApplicationsPerCustomer = maxApplicationsPerCustomer
    },
    setValidFrom: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { validFrom }: DiscountCodeSetValidFromAction
    ) => {
      resource.validFrom = validFrom
    },
    setValidUntil: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { validUntil }: DiscountCodeSetValidUntilAction
    ) => {
      resource.validUntil = validUntil
    },
    setValidFromAndUntil: (
      projectKey: string,
      resource: Writable<DiscountCode>,
      { validFrom, validUntil }: DiscountCodeSetValidFromAndUntilAction
    ) => {
      resource.validFrom = validFrom
      resource.validUntil = validUntil
    },
  }
}
