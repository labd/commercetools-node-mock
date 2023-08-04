import type {
	InvalidInputError,
	ProductDraft,
	ProductProjection,
	QueryParam,
} from '@commercetools/platform-sdk'
import { ParsedQs } from 'qs'
import { QueryParamsAsArray } from '../helpers.js'
import { ProductProjectionSearch } from '../product-projection-search.js'
import { type AbstractStorage } from '../storage/index.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import { parseQueryExpression } from '../lib/predicateParser.js'
import { CommercetoolsError } from '../exceptions.js'

type ProductProjectionQueryParams = {
	staged?: boolean
	priceCurrency?: string
	priceCountry?: string
	priceCustomerGroup?: string
	priceChannel?: string
	localeProjection?: string | string[]
	storeProjection?: string
	expand?: string | string[]
	sort?: string | string[]
	limit?: number
	offset?: number
	withTotal?: boolean
	where?: string | string[]
	[key: string]: QueryParam
}

export class ProductProjectionRepository extends AbstractResourceRepository<'product-projection'> {
	protected _searchService: ProductProjectionSearch

	constructor(storage: AbstractStorage) {
		super(storage)
		this._searchService = new ProductProjectionSearch(storage)
	}

	getTypeId() {
		return 'product-projection' as const
	}

	create(context: RepositoryContext, draft: ProductDraft): ProductProjection {
		throw new Error('No valid action')
	}

	query(context: RepositoryContext, params: ProductProjectionQueryParams = {}) {
		let resources = this._storage
			.all(context.projectKey, 'product')
			.map((r) => this._searchService.transform(r, params.staged ?? false))
			.filter((p) => {
				if (!params.staged ?? false) {
					return p.published
				}
				return true
			})

		// Apply predicates
		if (params.where) {
			const variableMap: Record<string, QueryParam> = {}
			for (const [k, v] of Object.entries(params)) {
				if (k.startsWith('var.')) {
					variableMap[k.substring(4)] = v
				}
			}

			try {
				const filterFunc = parseQueryExpression(params.where)
				resources = resources.filter((resource) =>
					filterFunc(resource, variableMap)
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
				this._storage.expand(context.projectKey, resource, params.expand)
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
		}
	}

	search(context: RepositoryContext, query: ParsedQs) {
		const results = this._searchService.search(context.projectKey, {
			filter: QueryParamsAsArray(query.filter),
			'filter.query': QueryParamsAsArray(query['filter.query']),
			facet: QueryParamsAsArray(query.facet),
			offset: query.offset ? Number(query.offset) : undefined,
			limit: query.limit ? Number(query.limit) : undefined,
			expand: QueryParamsAsArray(query.expand),
			staged: query.staged === 'true',
		})

		return results
	}

	actions = {}
}
