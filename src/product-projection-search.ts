import {
  InvalidInputError,
  ProductProjectionPagedSearchResponse,
  Product,
  ProductProjection,
  QueryParam,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from './exceptions'
import { parseFilterExpression } from './lib/projectionSearchFilter'
import { applyPriceSelector } from './priceSelector'
import { AbstractStorage } from './storage'

export type ProductProjectionSearchParams = {
  fuzzy?: boolean
  fuzzyLevel?: number
  markMatchingVariants?: boolean
  staged?: boolean
  filter?: string[]
  'filter.facets'?: string[]
  'filter.query'?: string[]
  facet?: string | string[]
  sort?: string | string[]
  limit?: number
  offset?: number
  withTotal?: boolean
  priceCurrency?: string
  priceCountry?: string
  priceCustomerGroup?: string
  priceChannel?: string
  localeProjection?: string
  storeProjection?: string
  expand?: string | string[]
  [key: string]: QueryParam
}

export class ProductProjectionSearch {
  protected _storage: AbstractStorage

  constructor(storage: AbstractStorage) {
    this._storage = storage
  }

  search(
    projectKey: string,
    params: ProductProjectionSearchParams
  ): ProductProjectionPagedSearchResponse {
    // Get a copy of all the products in the storage engine. We need a copy
    // since we will be modifying the data.
    let resources = this._storage
      .all(projectKey, 'product')
      .map(r => JSON.parse(JSON.stringify(r)))

    let markMatchingVariant = params.markMatchingVariants ?? false

    // Apply the priceSelector
    applyPriceSelector(resources, {
      country: params.priceCountry,
      channel: params.priceChannel,
      customerGroup: params.priceCustomerGroup,
      currency: params.priceCurrency,
    })

    // Apply filters pre facetting
    if (params.filter) {
      try {
        const filters = params.filter.map(f =>
          parseFilterExpression(f, params.staged ?? false)
        )

        // Filters can modify the output. So clone the resources first.
        resources = resources
          .filter(resource =>
            filters.every(f => f(resource, markMatchingVariant))
          )
      } catch (err) {
        throw new CommercetoolsError<InvalidInputError>(
          {
            code: 'InvalidInput',
            message: (err as any).message,
          },
          400
        )
      }
    }

    // TODO: Calculate facets

    // Apply filters post facetting
    if (params['filter.query']) {
      try {
        const filters = params['filter.query'].map(f =>
          parseFilterExpression(f, params.staged ?? false)
        )
        resources = resources
          .filter(resource =>
            filters.every(f => f(resource, markMatchingVariant))
          )
      } catch (err) {
        throw new CommercetoolsError<InvalidInputError>(
          {
            code: 'InvalidInput',
            message: (err as any).message,
          },
          400
        )
      }
    }

    // Get the total before slicing the array
    const totalResources = resources.length

    // Apply offset, limit
    const offset = params.offset || 0
    const limit = params.limit || 20
    resources = resources.slice(offset, offset + limit)

    // Expand the resources
    if (params.expand !== undefined) {
      resources = resources.map(resource => {
        return this._storage.expand(projectKey, resource, params.expand)
      })
    }

    return {
      count: totalResources,
      total: resources.length,
      offset: offset,
      limit: limit,
      results: resources.map(this.transform),
      facets: {},
    }
  }

  transform(product: Product): ProductProjection {
    const obj = product.masterData.current
    return {
      id: product.id,
      createdAt: product.createdAt,
      lastModifiedAt: product.lastModifiedAt,
      version: product.version,
      name: obj.name,
      slug: obj.slug,
      categories: obj.categories,
      masterVariant: obj.masterVariant,
      variants: obj.variants,
      productType: product.productType,
    }
  }
}
