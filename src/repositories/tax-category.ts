import {
  ReferenceTypeId,
  TaxCategory,
  TaxCategoryDraft,
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
      rates: draft.rates?.map(this.taxRateFromTaxRateDraft),
    }
    this.save(projectKey, resource)
    return resource
  }

  taxRateFromTaxRateDraft = (draft: TaxRateDraft): TaxRate => ({
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
      throw new Error('Duplicate tax categorie key')
    }

    return
  }

  actions: Partial<
    Record<
      TaxCategoryUpdateAction['action'],
      (projectKey: string, resource: Writable<TaxCategory>, action: any) => void
    >
  > = {}
}
