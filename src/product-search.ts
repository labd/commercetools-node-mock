import {
	InvalidInputError,
	Product,
	ProductPagedSearchResponse,
	ProductProjection,
	ProductSearchRequest,
	ProductSearchResult,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "./exceptions";
import { parseSearchQuery } from "./lib/productSearchFilter";
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
		let resources = this._storage
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

		const markMatchingVariant = params.markMatchingVariants ?? false;

		// Apply filters pre faceting
		if (params.query) {
			try {
				const matchFunc = parseSearchQuery(params.query);

				// Filters can modify the output. So clone the resources first.
				resources = resources.filter((resource) =>
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
			applyPriceSelector(resources, {
				country: params.productProjectionParameters.priceCountry,
				channel: params.productProjectionParameters.priceChannel,
				customerGroup: params.productProjectionParameters.priceCustomerGroup,
				currency: params.productProjectionParameters.priceCurrency,
			});
		}

		// TODO: Calculate facets
		// TODO: sorting based on boosts

		const offset = params.offset || 0;
		const limit = params.limit || 20;
		const results = resources.slice(offset, offset + limit);

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
