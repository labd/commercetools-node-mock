import {
  InvalidInputError,
  ProductProjectionPagedSearchResponse,
  Product,
  ProductProjection,
  QueryParam,
  FacetResults,
  FacetTerm,
  TermFacetResult,
} from '@commercetools/platform-sdk'
import { ByProjectKeyProductProjectionsSearchRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/search/by-project-key-product-projections-search-request-builder'
import { nestedLookup } from './helpers'
import { ProductService } from './services/product'
import { Writable } from './types'
import { CommercetoolsError } from './exceptions'
import {
  getVariants,
  parseFilterExpression,
  resolveVariantValue,
} from './lib/projectionSearchFilter'
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

    // TODO: Calculate facets
    const facets = this.getFacets(params, resources)

    // Apply filters post facetting
    if (params['filter.query']) {
      try {
        const filters = params['filter.query'].map(f =>
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
      facets: facets,
    }
  }

  getFacets(
    params: ProductProjectionSearchParams,
    products: Product[]
  ): FacetResults {
    if (!params.facet) return {}
    const staged = false
    const result: FacetResults = {}

    for (const facet of params.facet) {
      // Term Facet
      if (!facet.includes(':')) {
        result[facet] = this.termFacet(facet, products, staged)
      }

      // Range Facet

      // FilteredFacet
    }

    return result
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

  /**
   * TODO: This implemention needs the following additional features:
   *  - counting products
   *  - correct dataType
   */
  termFacet(
    facet: string,
    products: Product[],
    staged: boolean
  ): TermFacetResult {
    const result: Writable<TermFacetResult> = {
      type: 'terms',
      dataType: 'text',
      missing: 0,
      total: 0,
      other: 0,
      terms: [],
    }
    const terms: Record<any, number> = {}

    if (facet.startsWith('variants.')) {
      products.forEach(p => {
        const variants = getVariants(p, staged)
        variants.forEach(v => {
          result.total++

          const path = facet.substring(facet.indexOf(".") + 1)
          let value = resolveVariantValue(v, path)
          if (value === undefined) {
            result.missing++
          } else {
            if (typeof value === 'number') {
              value = Number(4).toFixed(1)
            }
            terms[value] = value in terms ? terms[value] + 1 : 1
          }
        })
      })
    } else {
      products.forEach(p => {
        const value = nestedLookup(p, facet)
        result.total++
        if (value === undefined) {
          result.missing++
        } else {
          terms[value] = value in terms ? terms[value] + 1 : 1
        }
      })
    }
    for (const term in terms) {
      result.terms.push({
        term: term as any,
        count: terms[term],
      })
    }
    return result
  }
}
