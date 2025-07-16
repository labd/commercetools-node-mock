import type {
	InvalidInputError,
	Product,
	ProductPagedSearchResponse,
	ProductProjection,
	ProductSearchRequest,
	ProductSearchResult,
} from "@commercetools/platform-sdk";
import type { Config } from "./config";
import { CommercetoolsError } from "./exceptions";
import { parseSearchQuery } from "./lib/productSearchFilter";
import { validateSearchQuery } from "./lib/searchQueryTypeChecker";
import { applyPriceSelector } from "./priceSelector";
import type { AbstractStorage } from "./storage";

interface ProductSearchVariantAvailability {
	isOnStock: boolean;
	availableQuantity: number;
	isOnStockForChannel: string | undefined;
}

export class ProductSearch {
	protected _storage: AbstractStorage;

	constructor(config: Config) {
		this._storage = config.storage;
	}

	search(
		projectKey: string,
		params: ProductSearchRequest,
	): ProductPagedSearchResponse {
		const availabilityBySku = this._storage
			.all(projectKey, "inventory-entry")
			.reduce((acc, entry) => {
				const existingEntry = acc.get(entry.sku);

				acc.set(entry.sku, {
					isOnStock: existingEntry?.isOnStock || entry.quantityOnStock > 0,
					availableQuantity:
						existingEntry?.availableQuantity ?? 0 + entry.quantityOnStock,
					// NOTE: This doesn't handle inventory entries for multiple channels,
					// so it doesn't exactly replicate the behavior of the commercetools api.
					isOnStockForChannel:
						existingEntry?.isOnStockForChannel ?? entry.supplyChannel?.id,
				});

				return acc;
			}, new Map<string, ProductSearchVariantAvailability>());

		let productResources = this._storage
			.all(projectKey, "product")
			.map((r) =>
				this.transformProduct(
					r,
					params.productProjectionParameters?.staged ?? false,
					availabilityBySku,
				),
			)
			.filter((p) => {
				if (!(params.productProjectionParameters?.staged ?? false)) {
					return p.published;
				}
				return true;
			});

		const markMatchingVariant = params.markMatchingVariants ?? false;

		// Apply filters pre facetting
		if (params.query) {
			try {
				validateSearchQuery(params.query);

				const matchFunc = parseSearchQuery(params.query);

				// Filters can modify the output. So clone the resources first.
				productResources = productResources.filter((resource) =>
					matchFunc(resource, markMatchingVariant),
				);
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
			applyPriceSelector(productResources, {
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
		const productProjectionsResult = productResources.slice(
			offset,
			offset + limit,
		);

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
			total: productResources.length,
			offset: offset,
			limit: limit,
			results: results,
			facets: [],
		};
	}

	transformProduct(
		product: Product,
		staged: boolean,
		availabilityBySku: Map<string, ProductSearchVariantAvailability>,
	): ProductProjection {
		const obj = !staged
			? product.masterData.current
			: product.masterData.staged;

		const getVariantAvailability = (sku?: string) => {
			if (!sku) {
				return {
					isOnStock: false,
					availableQuantity: 0,
					isOnStockForChannel: undefined,
				};
			}
			return (
				availabilityBySku.get(sku) || {
					isOnStock: false,
					availableQuantity: 0,
					isOnStockForChannel: undefined,
				}
			);
		};

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
			masterVariant: {
				...obj.masterVariant,
				availability: getVariantAvailability(obj.masterVariant.sku),
			},
			variants: obj.variants.map((variant) => ({
				...variant,
				availability: getVariantAvailability(variant.sku),
			})),
			productType: product.productType,
			hasStagedChanges: product.masterData.hasStagedChanges,
			published: product.masterData.published,
		};
	}
}
