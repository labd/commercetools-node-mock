import {
  InvalidInputError,
  ProductProjectionPagedSearchResponse,
  Product,
  ProductProjection,
  QueryParam,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from 'exceptions'
import { parseFilterExpression } from 'lib/projectionSearchFilter'
import { AbstractStorage } from 'storage'

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
    let resources = this._storage.all(projectKey, 'product')
    let markMatchingVariant = params.markMatchingVariants ?? false

    // Apply filters pre facetting
    if (params.filter) {
      try {
        const filters = params.filter.map(f =>
          parseFilterExpression(f, params.staged ?? false)
        )
        resources = resources.filter(resource =>
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
    console.log(resources)

    // TODO: Calculate facets

    // Apply filters post facetting
    if (params["filter.query"]) {
      try {
        const filters = params["filter.query"].map(f =>
          parseFilterExpression(f, params.staged ?? false)
        )
        resources = resources.filter(resource =>
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
