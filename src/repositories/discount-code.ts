import type {
  CartDiscountReference,
  DiscountCode,
  DiscountCodeChangeCartDiscountsAction,
  DiscountCodeChangeIsActiveAction,
  DiscountCodeDraft,
  DiscountCodeSetCartPredicateAction,
  DiscountCodeSetCustomFieldAction,
  DiscountCodeSetCustomTypeAction,
  DiscountCodeSetDescriptionAction,
  DiscountCodeSetMaxApplicationsAction,
  DiscountCodeSetMaxApplicationsPerCustomerAction,
  DiscountCodeSetNameAction,
  DiscountCodeSetValidFromAction,
  DiscountCodeSetValidFromAndUntilAction,
  DiscountCodeSetValidUntilAction,
  DiscountCodeUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, type RepositoryContext } from './abstract.js'
import { createCustomFields } from './helpers.js'

export class DiscountCodeRepository extends AbstractResourceRepository<'discount-code'> {
  getTypeId() {
    return 'discount-code' as const
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
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.saveNew(context, resource)
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
    setCustomType: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { type, fields }: DiscountCodeSetCustomTypeAction
    ) => {
      if (type) {
        resource.custom = createCustomFields(
          { type, fields },
          context.projectKey,
          this._storage
        )
      } else {
        resource.custom = undefined
      }
    },
    setCustomField: (
      context: RepositoryContext,
      resource: Writable<DiscountCode>,
      { name, value }: DiscountCodeSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        return
      }
      if (value === null) {
        delete resource.custom.fields[name]
      } else {
        resource.custom.fields[name] = value
      }
    },
  }
}
