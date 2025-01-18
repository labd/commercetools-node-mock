import type {
	CategoryReference,
	InvalidJsonInputError,
	Product,
	ProductData,
	ProductDraft,
	ProductPagedSearchResponse,
	ProductSearchRequest,
	ProductTypeReference,
	StateReference,
	TaxCategoryReference,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { CommercetoolsError } from "~src/exceptions";
import { getBaseResourceProperties } from "~src/helpers";
import { ProductSearch } from "~src/product-search";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { getReferenceFromResourceIdentifier } from "../helpers";
import { ProductUpdateHandler } from "./actions";
import { variantFromDraft } from "./helpers";

export class ProductRepository extends AbstractResourceRepository<"product"> {
	protected _searchService: ProductSearch;

	constructor(config: Config) {
		super("product", config);
		this.actions = new ProductUpdateHandler(config.storage);
		this._searchService = new ProductSearch(config);
	}

	create(context: RepositoryContext, draft: ProductDraft): Product {
		if (!draft.masterVariant) {
			throw new Error("Missing master variant");
		}

		let productType: ProductTypeReference | undefined = undefined;
		try {
			productType = getReferenceFromResourceIdentifier<ProductTypeReference>(
				draft.productType,
				context.projectKey,
				this._storage,
			);
		} catch (err) {
			// For now accept missing product types (but warn)
			console.warn(
				`Error resolving product-type '${draft.productType.id}'. This will be throw an error in later releases.`,
			);
			productType = {
				typeId: "product-type",
				id: draft.productType.id || "",
			};
		}

		// Resolve Product categories
		const categoryReferences: CategoryReference[] = [];
		draft.categories?.forEach((category) => {
			if (category) {
				categoryReferences.push(
					getReferenceFromResourceIdentifier<CategoryReference>(
						category,
						context.projectKey,
						this._storage,
					),
				);
			} else {
				throw new CommercetoolsError<InvalidJsonInputError>(
					{
						code: "InvalidJsonInput",
						message: "Request body does not contain valid JSON.",
						detailedErrorMessage: "categories: JSON object expected.",
					},
					400,
				);
			}
		});

		// Resolve Tax category
		let taxCategoryReference: TaxCategoryReference | undefined = undefined;
		if (draft.taxCategory) {
			taxCategoryReference =
				getReferenceFromResourceIdentifier<TaxCategoryReference>(
					draft.taxCategory,
					context.projectKey,
					this._storage,
				);
		}

		// Resolve Product State
		let productStateReference: StateReference | undefined = undefined;
		if (draft.state) {
			productStateReference =
				getReferenceFromResourceIdentifier<StateReference>(
					draft.state,
					context.projectKey,
					this._storage,
				);
		}

		const productData: ProductData = {
			name: draft.name,
			slug: draft.slug,
			description: draft.description,
			categories: categoryReferences,
			masterVariant: variantFromDraft(
				context,
				this._storage,
				1,
				draft.masterVariant,
			),
			variants:
				draft.variants?.map((variant, index) =>
					variantFromDraft(context, this._storage, index + 2, variant),
				) ?? [],
			metaTitle: draft.metaTitle,
			metaDescription: draft.metaDescription,
			metaKeywords: draft.metaKeywords,
			searchKeywords: draft.searchKeywords ?? {},
		};

		const resource: Product = {
			...getBaseResourceProperties(),
			key: draft.key,
			productType: productType,
			taxCategory: taxCategoryReference,
			state: productStateReference,
			masterData: {
				current: productData,
				staged: productData,
				hasStagedChanges: false,
				published: draft.publish ?? false,
			},
		};

		return this.saveNew(context, resource);
	}

	search(
		context: RepositoryContext,
		searchRequest: ProductSearchRequest,
	): ProductPagedSearchResponse {
		return this._searchService.search(context.projectKey, searchRequest);
	}
}
