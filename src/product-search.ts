import {
	InvalidInputError,
	Product,
	ProductPagedSearchResponse,
	ProductProjection,
	ProductSearchRequest,
	ProductSearchResult,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "./exceptions";
import { validateSearchQuery } from "./lib/searchQueryTypeChecker";
import { applyPriceSelector } from "./priceSelector";
import { AbstractStorage } from "./storage";

export class ProductSearch {
	protected _storage: AbstractStorage;

	constructor(storage: AbstractStorage) {
		this._storage = storage;
	}

	search(
		projectKey: string,
		params: ProductSearchRequest,
	): ProductPagedSearchResponse {
		const resources = this._storage
			.all(projectKey, "product")
			.map((r) =>
				this.transform(r, params.productProjectionParameters?.staged ?? false),
			)
			.filter((p) => {
				if (!params.productProjectionParameters?.staged ?? false) {
					return p.published;
				}
				return true;
			});

		// Validate query, if given
		if (params.query) {
			try {
				validateSearchQuery(params.query);
			} catch (err) {
				console.error(err);
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: (err as any).message,
					},
					400,
				);
			}
		}

		// Apply the priceSelector
		if (params.productProjectionParameters) {
			applyPriceSelector(resources, {
				country: params.productProjectionParameters.priceCountry,
				channel: params.productProjectionParameters.priceChannel,
				customerGroup: params.productProjectionParameters.priceCustomerGroup,
				currency: params.productProjectionParameters.priceCurrency,
			});
		}

		// @TODO: Determine whether or not to spoof search, facet filtering, wildcard, boosting and/or sorting.
		//        For now this is deliberately not supported.

		const offset = params.offset || 0;
		const limit = params.limit || 20;
		const productProjectionsResult = resources.slice(offset, offset + limit);

		/**
		 * Do not supply productProjection if productProjectionParameters are not given
		 * https://docs.commercetools.com/api/projects/product-search#with-product-projection-parameters
		 */
		const productProjectionsParameterGiven =
			!!params?.productProjectionParameters;

		// Transform to ProductSearchResult
		const results: ProductSearchResult[] = productProjectionsResult.map(
			(product) => ({
				productProjection: productProjectionsParameterGiven
					? product
					: undefined,
				id: product.id,
				/**
				 * @TODO: possibly add support for optional matchingVariants
				 * 		https://docs.commercetools.com/api/projects/product-search#productsearchmatchingvariants
				 */
			}),
		);

		return {
			total: resources.length,
			offset: offset,
			limit: limit,
			results: results,
			facets: [],
		};
	}

	transform(product: Product, staged: boolean): ProductProjection {
		const obj = !staged
			? product.masterData.current
			: product.masterData.staged;

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
		};
	}
}
