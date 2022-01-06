import {
  ReferenceTypeId,
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
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { v4 as uuidv4 } from 'uuid'
import { Writable } from 'types'

export class TaxCategoryRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'tax-category'
  }

  create(projectKey: string, draft: TaxCategoryDraft): TaxCategory {
    const resource: TaxCategory = {
      ...getBaseResourceProperties(),
      ...draft,
      rates: draft.rates?.map(this.taxRateFromTaxRateDraft) || [],
    }
    this.save(projectKey, resource)
    return resource
  }

  private taxRateFromTaxRateDraft = (draft: TaxRateDraft): TaxRate => ({
    ...draft,
    id: uuidv4(),
    amount: draft.amount || 0,
  })

  getWithKey(projectKey: string, key: string): TaxCategory | undefined {
    const result = this._storage.query(projectKey, this.getTypeId(), {
      where: [`key="${key}"`],
    })
    if (result.count === 1) {
      return result.results[0] as TaxCategory
    }

    // Catch this for now, should be checked when creating/updating
    if (result.count > 1) {
      throw new Error('Duplicate tax category key')
    }

    return
  }

  actions: Partial<
    Record<
      TaxCategoryUpdateAction['action'],
      (projectKey: string, resource: Writable<TaxCategory>, action: any) => void
    >
  > = {
    addTaxRate: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { taxRate }: TaxCategoryAddTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }
      resource.rates.push(this.taxRateFromTaxRateDraft(taxRate))
    },
    removeTaxRate: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { taxRateId }: TaxCategoryRemoveTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }
      resource.rates = resource.rates.filter(taxRate => {
        return taxRate.id !== taxRateId
      })
    },
    replaceTaxRate: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { taxRateId, taxRate }: TaxCategoryReplaceTaxRateAction
    ) => {
      if (resource.rates === undefined) {
        resource.rates = []
      }

      const taxRateObj = this.taxRateFromTaxRateDraft(taxRate)
      for (let i = 0; i < resource.rates.length; i++) {
        const rate = resource.rates[i]
        if (rate.id == taxRateId) {
          resource.rates[i] = taxRateObj
        }
      }
    },
    setDescription: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { description }: TaxCategorySetDescriptionAction
    ) => {
      resource.description = description
    },
    setKey: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { key }: TaxCategorySetKeyAction
    ) => {
      resource.key = key
    },
    changeName: (
      projectKey: string,
      resource: Writable<TaxCategory>,
      { name }: TaxCategoryChangeNameAction
    ) => {
      resource.name = name
    },
  }
}
