import type {
  TaxCategory,
  TaxCategoryAddTaxRateAction,
  TaxCategoryChangeNameAction,
  TaxCategoryDraft,
  TaxCategoryRemoveTaxRateAction,
  TaxCategoryReplaceTaxRateAction,
  TaxCategorySetDescriptionAction,
  TaxCategorySetKeyAction,
  TaxCategoryUpdateAction,
  TaxRate,
  TaxRateDraft,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class TaxCategoryRepository extends AbstractResourceRepository<'tax-category'> {
  getTypeId() {
    return 'tax-category' as const
  }

  create(context: RepositoryContext, draft: TaxCategoryDraft): TaxCategory {
    const resource: TaxCategory = {
      ...getBaseResourceProperties(),
      ...draft,
      rates: draft.rates?.map(this.taxRateFromTaxRateDraft) || [],
    }
    this.saveNew(context, resource)
    return resource
  }

  private taxRateFromTaxRateDraft = (draft: TaxRateDraft): TaxRate => ({
    ...draft,
    id: uuidv4(),
    amount: draft.amount || 0,
  })

  actions: Partial<
    Record<
      TaxCategoryUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<TaxCategory>,
        action: any
      ) => void
    >
  > = {
    addTaxRate: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { taxRate }: TaxCategoryAddTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }
      resource.rates.push(this.taxRateFromTaxRateDraft(taxRate))
    },
    removeTaxRate: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { taxRateId }: TaxCategoryRemoveTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }
      resource.rates = resource.rates.filter(
        (taxRate) => taxRate.id !== taxRateId
      )
    },
    replaceTaxRate: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { taxRateId, taxRate }: TaxCategoryReplaceTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }

      const taxRateObj = this.taxRateFromTaxRateDraft(taxRate)
      for (let i = 0; i < resource.rates.length; i++) {
        const rate = resource.rates[i]
        if (rate.id === taxRateId) {
          resource.rates[i] = taxRateObj
        }
      }
    },
    setDescription: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { description }: TaxCategorySetDescriptionAction
    ) => {
      resource.description = description
    },
    setKey: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { key }: TaxCategorySetKeyAction
    ) => {
      resource.key = key
    },
    changeName: (
      context: RepositoryContext,
      resource: Writable<TaxCategory>,
      { name }: TaxCategoryChangeNameAction
    ) => {
      resource.name = name
    },
  }
}
