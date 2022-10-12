import {
  InvalidInputError,
  ProductProjectionPagedSearchResponse,
  Product,
  ProductProjection,
  QueryParam,
  FacetResults,
  TermFacetResult,
  RangeFacetResult,
  FilteredFacetResult,
} from '@commercetools/platform-sdk'
import { nestedLookup } from './helpers'
import { Writable } from './types'
import { CommercetoolsError } from './exceptions'
import {
  FilterExpression,
  generateFacetFunc,
  getVariants,
  parseFilterExpression,
  RangeExpression,
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
    let resources = this._storage
      .all(projectKey, 'product')
      .map((r) => this.transform(r, params.staged ?? false))
      .filter((p) => {
        if (!params.staged ?? false) {
          return p.published
        }
        return true
      })

    const markMatchingVariant = params.markMatchingVariants ?? false

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
        const filters = params.filter.map(parseFilterExpression)

        // Filters can modify the output. So clone the resources first.
        resources = resources.filter((resource) =>
          filters.every((f) => f(resource, markMatchingVariant))
        )
      } catch (err) {
        console.error(err)
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
        const filters = params['filter.query'].map(parseFilterExpression)
        resources = resources.filter((resource) =>
          filters.every((f) => f(resource, markMatchingVariant))
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

    // Expand the resources
    if (params.expand !== undefined) {
      resources = resources.map((resource) =>
        this._storage.expand(projectKey, resource, params.expand)
      )
    }

    // Create a slice for the pagination. If we were working with large datasets
    // then we should have done this before transforming. But that isn't the
    // goal of this library. So lets keep it simple.
    const totalResults = resources.length
    const offset = params.offset || 0
    const limit = params.limit || 20
    const results = resources.slice(offset, offset + limit)

    return {
      count: totalResults,
      total: results.length,
      offset: offset,
      limit: limit,
      results: results,
      facets: facets,
    }
  }

  transform(product: Product, staged: boolean): ProductProjection {
    const obj = !staged ? product.masterData.current : product.masterData.staged

    return {
      id: product.id,
      createdAt: product.createdAt,
      lastModifiedAt: product.lastModifiedAt,
      version: product.version,
      name: obj.name,
      key: product.key,
      description: obj.description,
      metaDescription: obj.metaDescription,
      slug: obj.slug,
      categories: obj.categories,
      masterVariant: obj.masterVariant,
      variants: obj.variants,
      productType: product.productType,
      hasStagedChanges: product.masterData.hasStagedChanges,
      published: product.masterData.published,
    }
  }

  getFacets(
    params: ProductProjectionSearchParams,
    products: ProductProjection[]
  ): FacetResults {
    if (!params.facet) return {}
    const staged = false
    const result: FacetResults = {}

    for (const facet of params.facet) {
      const expression = generateFacetFunc(facet)

      // Term Facet
      if (expression.type === 'TermExpression') {
        result[facet] = this.termFacet(expression.source, products)
      }

      // Range Facet
      if (expression.type === 'RangeExpression') {
        result[expression.source] = this.rangeFacet(
          expression.source,
          expression.children,
          products
        )
      }

      // FilteredFacet
      if (expression.type === 'FilterExpression') {
        result[expression.source] = this.filterFacet(
          expression.source,
          expression.children,
          products
        )
      }
    }

    return result
  }

  /**
   * TODO: This implemention needs the following additional features:
   *  - counting products
   *  - correct dataType
   */
  termFacet(facet: string, products: ProductProjection[]): TermFacetResult {
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
      products.forEach((p) => {
        const variants = getVariants(p)
        variants.forEach((v) => {
          result.total++

          let value = resolveVariantValue(v, facet)
          if (value === undefined) {
            result.missing++
          } else {
            if (typeof value === 'number') {
              value = Number(value).toFixed(1)
            }
            terms[value] = value in terms ? terms[value] + 1 : 1
          }
        })
      })
    } else {
      products.forEach((p) => {
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

  filterFacet(
    source: string,
    filters: FilterExpression[] | undefined,
    products: ProductProjection[]
  ): FilteredFacetResult {
    let count = 0
    if (source.startsWith('variants.')) {
      for (const p of products) {
        for (const v of getVariants(p)) {
          const val = resolveVariantValue(v, source)
          if (filters?.some((f) => f.match(val))) {
            count++
          }
        }
      }
    } else {
      throw new Error('not supported')
    }

    return {
      type: 'filter',
      count: count,
    }
  }

  rangeFacet(
    source: string,
    ranges: RangeExpression[] | undefined,
    products: ProductProjection[]
  ): RangeFacetResult {
    const counts =
      ranges?.map((range) => {
        if (source.startsWith('variants.')) {
          const values = []
          for (const p of products) {
            for (const v of getVariants(p)) {
              const val = resolveVariantValue(v, source)
              if (val === undefined) {
                continue
              }

              if (range.match(val)) {
                values.push(val)
              }
            }
          }

          const numValues = values.length
          return {
            type: 'double',
            from: range.start || 0,
            fromStr: range.start !== null ? Number(range.start).toFixed(1) : '',
            to: range.stop || 0,
            toStr: range.stop !== null ? Number(range.stop).toFixed(1) : '',
            count: numValues,
            // totalCount: 0,
            total: values.reduce((a, b) => a + b, 0),
            min: numValues > 0 ? Math.min(...values) : 0,
            max: numValues > 0 ? Math.max(...values) : 0,
            mean: numValues > 0 ? mean(values) : 0,
          }
        } else {
          throw new Error('not supported')
        }
      }) || []
    const data: RangeFacetResult = {
      type: 'range',
      // @ts-ignore
      dataType: 'number',
      ranges: counts,
    }
    return data
  }
}

const mean = (arr: number[]) => {
  let total = 0
  for (let i = 0; i < arr.length; i++) {
    total += arr[i]
  }
  return total / arr.length
}
