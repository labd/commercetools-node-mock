import type {
	InvalidInputError,
	ProductDraft,
	ProductProjection,
	QueryParam,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { CommercetoolsError } from "~src/exceptions";
import { parseQueryExpression } from "../lib/predicateParser";
import { applyPriceSelector } from "../priceSelector";
import { ProductProjectionSearch } from "../product-projection-search";
import type { GetParams, RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

export type ProductProjectionQueryParams = {
	staged?: boolean;
	priceCurrency?: string;
	priceCountry?: string;
	priceCustomerGroup?: string;
	priceChannel?: string;
	localeProjection?: string;
	storeProjection?: string;
	expand?: string | string[];
	sort?: string | string[];
	limit?: number;
	offset?: number;
	withTotal?: boolean;
	where?: string | string[];
	[key: string]: QueryParam;
};

export class ProductProjectionRepository extends AbstractResourceRepository<"product-projection"> {
	protected _searchService: ProductProjectionSearch;

	constructor(config: Config) {
		super("product-projection", config);
		this._searchService = new ProductProjectionSearch(config);
	}

	create(context: RepositoryContext, draft: ProductDraft): ProductProjection {
		throw new Error("No valid action");
	}

	get(
		context: RepositoryContext,
		id: string,
		params: GetParams = {},
	): ProductProjection | null {
		const resource = this._storage.get(
			context.projectKey,
			"product",
			id,
			params,
		);
		if (resource) {
			return this._searchService.transform(resource, false, context.projectKey);
		}
		return null;
	}

	query(context: RepositoryContext, params: ProductProjectionQueryParams = {}) {
		let resources = this._storage
			.all(context.projectKey, "product")
			.map((r) =>
				this._searchService.transform(
					r,
					params.staged ?? false,
					context.projectKey,
				),
			)
			.filter((p) => {
				if (!(params.staged ?? false)) {
					return p.published;
				}
				return true;
			});

		// Apply predicates
		if (params.where) {
			const variableMap: Record<string, QueryParam> = {};
			for (const [k, v] of Object.entries(params)) {
				if (k.startsWith("var.")) {
					variableMap[k.substring(4)] = v;
				}
			}

			try {
				const filterFunc = parseQueryExpression(params.where);
				resources = resources.filter((resource) =>
					filterFunc(resource, variableMap),
				);
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: (err as any).message,
					},
					400,
				);
			}
		}

		// We do this after the filtering, since the docs mention:
		// Only available when Price selection is used. Cannot be used in a Query
		// Predicate.
		applyPriceSelector(
			resources,
			{
				country: params.priceCountry,
				channel: params.priceChannel,
				customerGroup: params.priceCustomerGroup,
				currency: params.priceCurrency,
			},
			true,
		);

		// Expand the resources
		if (params.expand !== undefined) {
			resources = resources.map((resource) =>
				this._storage.expand(context.projectKey, resource, params.expand),
			);
		}

		// Create a slice for the pagination. If we were working with large datasets
		// then we should have done this before transforming. But that isn't the
		// goal of this library. So lets keep it simple.
		const totalResults = resources.length;
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		const results = resources.slice(offset, offset + limit);

		return {
			count: totalResults,
			total: results.length,
			offset: offset,
			limit: limit,
			results: results,
		};
	}

	search(context: RepositoryContext, query: ProductProjectionQueryParams) {
		return this._searchService.search(context.projectKey, query);
	}
}
