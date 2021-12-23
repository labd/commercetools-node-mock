import { ParsedQs } from 'qs'
import {
  ProductDraft,
  ProductProjection,
  ProductVariant,
  ProductVariantDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { RepositoryTypes } from '../types'
import { parseFilterExpression } from '../lib/filterParser'

export class ProductProjectionRepository extends AbstractResourceRepository {
  getTypeId(): RepositoryTypes {
    return 'product-projection'
  }

  create(projectKey: string, draft: ProductDraft): ProductProjection {
    if (!draft.masterVariant) {
      throw new Error(
        `must provider mastervariant for product projection with key ${draft.key}`
      )
    }

    if (!draft.productType.id) {
      throw new Error(
        `must provider product type id for product projection with key ${draft.key}`
      )
    }

    const resource: ProductProjection = {
      ...getBaseResourceProperties(),
      name: draft.name,
      slug: draft.slug,
      categories: [],
      productType: { ...draft.productType, id: draft.productType.id! },
      masterVariant: variantFromDraft(0, draft.masterVariant!),
      variants:
        draft.variants?.map((variant, index) => {
          return variantFromDraft(index + 1, variant)
        }) ?? [],

      // @ts-ignore
      searchKeywords: draft.searchKeywords,
    }

    this.save(projectKey, resource)

    return resource
  }

  search(projectKey: string, query: ParsedQs) {
    const wherePredicate = parseFilterExpression(query.filter as any)

    const results = this._storage.query(projectKey, this.getTypeId(), {
      where: wherePredicate,
    }) //TODO: this is a partial implementation, but I don't really have the time to implement an actual search API right now

    return results
  }

  actions = {}
}

const variantFromDraft = (
  variantId: number,
  variant: ProductVariantDraft
): ProductVariant => {
  return {
    id: variantId,
    sku: variant?.sku,
    attributes: variant?.attributes,
  }
}
