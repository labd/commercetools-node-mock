import { getReferenceFromResourceIdentifier } from './helpers'
import {
  ReferenceTypeId,
  TaxCategory,
  TaxCategoryDraft,
  TaxRate,
  TaxRateDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'
import { v4 as uuidv4 } from 'uuid'

export class TaxCategoryRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'tax-category'
  }

  create(projectKey: string, draft: TaxCategoryDraft): TaxCategory {
    const resource: TaxCategory = {
      ...getBaseResourceProperties(),
      ...draft,
      rates: draft.rates.map(this.taxRateFromTaxRateDraft),
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

  actions = {}
}
