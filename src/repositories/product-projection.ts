import type {
	InvalidInputError,
	InvalidOperationError,
	ProductDraft,
	ProductProjection,
	QueryParam,
	SearchKeyword,
	SuggestionResult,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { parseQueryExpression } from "../lib/predicateParser.ts";
import { applySort } from "../lib/sortParser.ts";
import { applyPriceSelector } from "../priceSelector.ts";
import { ProductProjectionSearch } from "../product-projection-search.ts";
import type { GetParams, RepositoryContext } from "./abstract.ts";
import { AbstractResourceRepository } from "./abstract.ts";

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

export type ProductProjectionSuggestParams = {
	searchKeywords: Record<string, string>;
	staged?: boolean;
	fuzzy?: boolean;
	fuzzyLevel?: number;
	limit?: number;
};

const DEFAULT_SUGGEST_LIMIT = 10;

/**
 * commercetools suggests on the tokens of a search keyword, so "tool" only
 * matches "Multi tool" when the keyword is tokenized.
 */
const keywordTokens = (keyword: SearchKeyword): string[] => {
	const tokenizer = keyword.suggestTokenizer;
	if (!tokenizer) {
		return [keyword.text];
	}
	if (tokenizer.type === "custom") {
		return tokenizer.inputs;
	}
	return keyword.text.split(/\s+/).filter(Boolean);
};

/**
 * The fuzzy level commercetools derives from the length of the search term when
 * `fuzzyLevel` is not given.
 *
 * @see https://docs.commercetools.com/api/projects/products-search#fuzzy-search
 */
const defaultFuzzyLevel = (term: string) => {
	if (term.length < 3) return 0;
	if (term.length < 6) return 1;
	return 2;
};

/**
 * Damerau-Levenshtein (optimal string alignment) distance: the same metric
 * Elasticsearch uses for fuzziness, so a transposed pair of characters counts
 * as one edit rather than two.
 */
const editDistance = (a: string, b: string): number => {
	const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, i) => i)];

	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const previous = rows[i - 1];
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
			if (
				i > 1 &&
				j > 1 &&
				a[i - 1] === b[j - 2] &&
				a[i - 2] === b[j - 1] &&
				rows[i - 2] !== undefined
			) {
				current[j] = Math.min(current[j], rows[i - 2][j - 2] + 1);
			}
		}
		rows[i] = current;
	}

	return rows[a.length][b.length];
};

export class ProductProjectionRepository extends AbstractResourceRepository<"product-projection"> {
	protected _searchService: ProductProjectionSearch;

	constructor(config: Config) {
		super("product-projection", config);
		this._searchService = new ProductProjectionSearch(config);
	}

	async create(
		context: RepositoryContext,
		draft: ProductDraft,
	): Promise<ProductProjection> {
		throw new CommercetoolsError<InvalidOperationError>(
			{
				code: "InvalidOperation",
				message: "No valid action",
			},
			400,
		);
	}

	async get(
		context: RepositoryContext,
		id: string,
		params: GetParams = {},
	): Promise<ProductProjection | null> {
		const resource = await this._storage.get(
			context.projectKey,
			"product",
			id,
			params,
		);
		if (resource) {
			return await this._searchService.transform(
				resource,
				false,
				context.projectKey,
			);
		}
		return null;
	}

	async query(
		context: RepositoryContext,
		params: ProductProjectionQueryParams = {},
	) {
		const allProducts = await this._storage.all(context.projectKey, "product");
		let resources = await Promise.all(
			allProducts.map((r) =>
				this._searchService.transform(
					r,
					params.staged ?? false,
					context.projectKey,
				),
			),
		);
		resources = resources.filter((p) => {
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
			resources = await Promise.all(
				resources.map((resource) =>
					this._storage.expand(context.projectKey, resource, params.expand),
				),
			);
		}

		// Sort before paging. This repository does not go through
		// AbstractStorage.query, so it needs its own call — without it a
		// cursor-paged walk (`sort: "id asc"` with `where: 'id > "<last>"'`) takes
		// its cursor from an unsorted page and skips products.
		resources = applySort(resources, params.sort);

		// Create a slice for the pagination. If we were working with large datasets
		// then we should have done this before transforming. But that isn't the
		// goal of this library. So lets keep it simple.
		const totalResults = resources.length;
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		const results = resources.slice(offset, offset + limit);

		return {
			count: results.length,
			total: totalResults,
			offset: offset,
			limit: limit,
			results: results,
		};
	}

	search(context: RepositoryContext, query: ProductProjectionQueryParams) {
		return this._searchService.search(context.projectKey, query);
	}

	async suggest(
		context: RepositoryContext,
		params: ProductProjectionSuggestParams,
	): Promise<SuggestionResult> {
		const staged = params.staged ?? false;
		const allProducts = await this._storage.all(context.projectKey, "product");
		const projections = (
			await Promise.all(
				allProducts.map((product) =>
					this._searchService.transform(product, staged, context.projectKey),
				),
			)
		).filter((projection) => staged || projection.published);

		const limit = params.limit ?? DEFAULT_SUGGEST_LIMIT;
		const result: SuggestionResult = {};

		for (const [locale, term] of Object.entries(params.searchKeywords)) {
			const needle = term.toLowerCase();
			const level = params.fuzzy
				? (params.fuzzyLevel ?? defaultFuzzyLevel(term))
				: 0;

			const texts = new Set<string>();
			for (const projection of projections) {
				for (const keyword of projection.searchKeywords?.[locale] ?? []) {
					const matches = keywordTokens(keyword).some((token) => {
						const prefix = token.slice(0, needle.length).toLowerCase();
						return level === 0
							? prefix === needle
							: editDistance(prefix, needle) <= level;
					});
					if (matches) {
						texts.add(keyword.text);
					}
				}
			}

			result[`searchKeywords.${locale}`] = [...texts]
				.slice(0, limit)
				.map((text) => ({ text }));
		}

		return result;
	}
}
