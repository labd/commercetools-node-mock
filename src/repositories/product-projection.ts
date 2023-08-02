import type {
	ProductDraft,
	ProductProjection,
} from '@commercetools/platform-sdk'
import { ParsedQs } from 'qs'
import { QueryParamsAsArray } from '../helpers.js'
import { ProductProjectionSearch } from '../product-projection-search.js'
import { type AbstractStorage } from '../storage/index.js'
import {
	AbstractResourceRepository,
	type QueryParams,
	RepositoryContext,
} from './abstract.js'

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

	query(context: RepositoryContext, params: QueryParams = {}) {
		const response = this._storage.query(context.projectKey, 'product', {
			expand: params.expand,
			where: params.where,
			offset: params.offset,
			limit: params.limit,
		})

		return {
			...response,
			results: response.results.map((r) =>
				this._searchService.transform(r, false)
			),
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
