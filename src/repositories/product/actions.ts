import type {
	CategoryReference,
	InvalidJsonInputError,
	InvalidOperationError,
	Price,
	Product,
	ProductAddExternalImageAction,
	ProductAddPriceAction,
	ProductAddToCategoryAction,
	ProductAddVariantAction,
	ProductChangeMasterVariantAction,
	ProductChangeNameAction,
	ProductChangePriceAction,
	ProductChangeSlugAction,
	ProductData,
	ProductMoveImageToPositionAction,
	ProductPublishAction,
	ProductRemoveFromCategoryAction,
	ProductRemoveImageAction,
	ProductRemovePriceAction,
	ProductRemoveVariantAction,
	ProductSetAttributeAction,
	ProductSetAttributeInAllVariantsAction,
	ProductSetDescriptionAction,
	ProductSetKeyAction,
	ProductSetMetaDescriptionAction,
	ProductSetMetaKeywordsAction,
	ProductSetMetaTitleAction,
	ProductSetProductPriceCustomFieldAction,
	ProductSetProductPriceCustomTypeAction,
	ProductSetTaxCategoryAction,
	ProductTransitionStateAction,
	ProductUpdateAction,
	ProductVariantDraft,
	StateReference,
	TaxCategoryReference,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import type { Writable } from "~src/types";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers";
import {
	checkForStagedChanges,
	getVariant,
	priceFromDraft,
	variantFromDraft,
} from "./helpers";

type ProductUpdateHandlerMethod<T> = (
	context: RepositoryContext,
	resource: Writable<Product>,
	action: T,
) => void;

type ProductUpdateActions = Partial<{
	[P in ProductUpdateAction as P["action"]]: ProductUpdateHandlerMethod<P>;
}>;

export class ProductUpdateHandler
	extends AbstractUpdateHandler
	implements ProductUpdateActions
{
	addExternalImage(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ variantId, sku, image, staged }: ProductAddExternalImageAction,
	) {
		const addImg = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			if (!variant.images) {
				variant.images = [];
			} else {
				const existingImage = variant.images.find((x) => x.url === image.url);
				if (existingImage) {
					throw new Error(
						`Cannot add image '${image.url}' because product '${resource.id}' already has that image.`,
					);
				}
			}

			// Add image
			variant.images.push(image);

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		addImg(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			addImg(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	addPrice(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ variantId, sku, price, staged }: ProductAddPriceAction,
	) {
		const addVariantPrice = (
			data: Writable<ProductData>,
			priceToAdd: Price,
		) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			if (variant.prices === undefined) {
				variant.prices = [priceToAdd];
			} else {
				variant.prices.push(priceToAdd);
			}

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// Pre-creating the price object ensures consistency between staged and current versions
		const priceToAdd = priceFromDraft(context, this._storage, price);

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		addVariantPrice(resource.masterData.staged, priceToAdd);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			addVariantPrice(resource.masterData.current, priceToAdd);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	addToCategory(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ category, staged, orderHint }: ProductAddToCategoryAction,
	) {
		const addCategory = (data: Writable<ProductData>) => {
			if (category) {
				data.categories.push(
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
						detailedErrorMessage: "actions -> category: Missing required value",
					},
					400,
				);
			}
		};

		const onlyStaged = staged !== undefined ? staged : true;

		addCategory(resource.masterData.staged);

		if (!onlyStaged) {
			addCategory(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	addVariant(
		context: RepositoryContext,
		resource: Writable<Product>,
		{
			sku,
			key,
			prices,
			images,
			attributes,
			staged,
			assets,
		}: ProductAddVariantAction,
	) {
		const variantDraft: ProductVariantDraft = {
			sku: sku,
			key: key,
			prices: prices,
			images: images,
			attributes: attributes,
			assets: assets,
		};

		const dataStaged = resource.masterData.staged;
		const allVariants = [
			dataStaged.masterVariant,
			...(dataStaged.variants ?? []),
		];
		const maxId = allVariants.reduce(
			(max, element) => (element.id > max ? element.id : max),
			0,
		);
		const variant = variantFromDraft(
			context,
			this._storage,
			maxId + 1,
			variantDraft,
		);
		dataStaged.variants.push(variant);

		const onlyStaged = staged !== undefined ? staged : true;

		if (!onlyStaged) {
			resource.masterData.current.variants.push(variant);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	changeMasterVariant(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ variantId, sku, staged }: ProductChangeMasterVariantAction,
	) {
		const setMaster = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			if (!isMasterVariant) {
				// Save previous master variant
				const masterVariantPrev = data.masterVariant;
				data.masterVariant = variant;
				// Remove new master from variants
				data.variants.splice(variantIndex, 1);
				// Add previous master to variants
				data.variants.push(masterVariantPrev);
			}
		};

		const onlyStaged = staged !== undefined ? staged : true;

		setMaster(resource.masterData.staged);

		if (!onlyStaged) {
			setMaster(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ name, staged }: ProductChangeNameAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;
		resource.masterData.staged.name = name;
		if (!onlyStaged) {
			resource.masterData.current.name = name;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	changePrice(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ priceId, price, staged }: ProductChangePriceAction,
	) {
		const changeVariantPrice = (data: Writable<ProductData>) => {
			const allVariants = [data.masterVariant, ...(data.variants ?? [])];
			const priceVariant = allVariants.find((variant) =>
				variant.prices?.some((x) => x.id === priceId),
			);
			if (!priceVariant) {
				throw new Error(
					`Price with id ${priceId} not found on product ${resource.id}`,
				);
			}

			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				priceVariant.id,
				priceVariant.sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${priceVariant.id} or sku ${priceVariant.sku} not found on product ${resource.id}`,
				);
			}

			variant.prices = variant.prices?.map((x) => {
				if (x.id === priceId) {
					return { ...x, ...price } as Price;
				}
				return x;
			});

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		changeVariantPrice(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			changeVariantPrice(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	changeSlug(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ slug, staged }: ProductChangeSlugAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;
		resource.masterData.staged.slug = slug;
		if (!onlyStaged) {
			resource.masterData.current.slug = slug;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	moveImageToPosition(
		context: RepositoryContext,
		resource: Writable<Product>,
		{
			variantId,
			sku,
			imageUrl,
			position,
			staged,
		}: ProductMoveImageToPositionAction,
	) {
		const moveImg = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			const variantImages = variant.images ?? [];
			const existingImage = variantImages.find((x) => x.url === imageUrl);
			if (!existingImage) {
				throw new Error(
					`Cannot move image '${imageUrl}' because product '${resource.id}' does not have that image.`,
				);
			}

			if (position >= variantImages.length) {
				throw new Error(
					`Invalid position given. Position in images where the image should be moved. Must be between 0 and the total number of images minus 1.`,
				);
			}

			// Remove image
			variant.images = variantImages.filter((image) => image.url !== imageUrl);

			// Re-add image to the correct position
			variant.images.splice(position, 0, existingImage);

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		moveImg(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			moveImg(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	publish(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ scope }: ProductPublishAction,
	) {
		resource.masterData.current = resource.masterData.staged;
		resource.masterData.published = true;
		checkForStagedChanges(resource);
	}

	removeFromCategory(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ category, staged }: ProductRemoveFromCategoryAction,
	) {
		const removeCategory = (data: Writable<ProductData>) => {
			if (category) {
				const resolvedCategory =
					getReferenceFromResourceIdentifier<CategoryReference>(
						category,
						context.projectKey,
						this._storage,
					);

				const foundCategory = data.categories.find(
					(productCategory: CategoryReference) => {
						if (productCategory.id === resolvedCategory.id) {
							return productCategory;
						}
						return false;
					},
				);

				if (!foundCategory) {
					throw new CommercetoolsError<InvalidOperationError>(
						{
							code: "InvalidOperation",
							message:
								`Cannot remove from category '${resolvedCategory.id}' because product ` +
								`'${resource.masterData.current.name}' is not in that category.`,
						},
						400,
					);
				}

				data.categories = data.categories.filter(
					(productCategory: CategoryReference) => {
						if (productCategory.id === resolvedCategory.id) {
							return false;
						}
						return true;
					},
				);
			} else {
				throw new CommercetoolsError<InvalidJsonInputError>(
					{
						code: "InvalidJsonInput",
						message: "Request body does not contain valid JSON.",
						detailedErrorMessage: "actions -> category: Missing required value",
					},
					400,
				);
			}
		};

		const onlyStaged = staged !== undefined ? staged : true;
		removeCategory(resource.masterData.staged);

		if (!onlyStaged) {
			removeCategory(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	removeImage(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ variantId, sku, imageUrl, staged }: ProductRemoveImageAction,
	) {
		const removeImg = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			const variantImages = variant.images ?? [];
			const existingImage = variantImages.find((x) => x.url === imageUrl);
			if (!existingImage) {
				throw new Error(
					`Cannot remove image '${imageUrl}' because product '${resource.id}' does not have that image.`,
				);
			}

			// Remove image
			variant.images = variantImages.filter((image) => image.url !== imageUrl);

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		removeImg(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			removeImg(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	removePrice(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ priceId, staged }: ProductRemovePriceAction,
	) {
		const removeVariantPrice = (data: Writable<ProductData>) => {
			const allVariants = [data.masterVariant, ...(data.variants ?? [])];
			const priceVariant = allVariants.find((variant) =>
				variant.prices?.some((x) => x.id === priceId),
			);
			if (!priceVariant) {
				throw new Error(
					`Price with id ${priceId} not found on product ${resource.id}`,
				);
			}

			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				priceVariant.id,
				priceVariant.sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${priceVariant.id} or sku ${priceVariant.sku} not found on product ${resource.id}`,
				);
			}

			variant.prices = variant.prices?.filter((x) => x.id !== priceId);

			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		removeVariantPrice(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			removeVariantPrice(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	removeVariant(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ id, sku, staged }: ProductRemoveVariantAction,
	) {
		const removeVariant = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				id,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${id} or sku ${sku} not found on product ${resource.id}`,
				);
			}
			if (isMasterVariant) {
				throw new Error(
					`Can not remove the variant [ID:${id}] for [Product:${resource.id}] since it's the master variant`,
				);
			}

			data.variants.splice(variantIndex, 1);
		};

		const onlyStaged = staged !== undefined ? staged : true;

		removeVariant(resource.masterData.staged);

		if (!onlyStaged) {
			removeVariant(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	setAttribute(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ variantId, sku, name, value, staged }: ProductSetAttributeAction,
	) {
		const setAttr = (data: Writable<ProductData>) => {
			const { variant, isMasterVariant, variantIndex } = getVariant(
				data,
				variantId,
				sku,
			);
			if (!variant) {
				throw new Error(
					`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`,
				);
			}

			if (!variant.attributes) {
				variant.attributes = [];
			}

			const existingAttr = variant.attributes.find(
				(attr) => attr.name === name,
			);
			if (existingAttr) {
				existingAttr.value = value;
			} else {
				variant.attributes.push({
					name,
					value,
				});
			}
			if (isMasterVariant) {
				data.masterVariant = variant;
			} else {
				data.variants[variantIndex] = variant;
			}
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		setAttr(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			setAttr(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	setAttributeInAllVariants(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ name, value, staged }: ProductSetAttributeInAllVariantsAction,
	) {
		const setAttrInAllVariants = (data: Writable<ProductData>) => {
			if (!data.masterVariant.attributes) {
				data.masterVariant.attributes = [];
			}

			const existingAttr = data.masterVariant.attributes?.find(
				(attr) => attr.name === name,
			);

			if (existingAttr) {
				existingAttr.value = value;
			} else {
				data.masterVariant.attributes.push({
					name,
					value,
				});
			}

			data.variants.forEach((variant) => {
				if (!variant.attributes) {
					variant.attributes = [];
				}

				const existingAttr = variant.attributes.find(
					(attr) => attr.name === name,
				);
				if (existingAttr) {
					existingAttr.value = value;
				} else {
					variant.attributes.push({
						name,
						value,
					});
				}
			});
		};

		// If true, only the staged Attribute is set. If false, both current and
		// staged Attribute is set.  Default is true
		const onlyStaged = staged !== undefined ? staged : true;

		// Write the attribute to the staged data
		setAttrInAllVariants(resource.masterData.staged);

		// Also write to published data is isStaged = false
		// if isStaged is false we set the attribute on both the staged and
		// published data.
		if (!onlyStaged) {
			setAttrInAllVariants(resource.masterData.current);
		}
		checkForStagedChanges(resource);

		return resource;
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ description, staged }: ProductSetDescriptionAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;

		resource.masterData.staged.description = description;
		if (!onlyStaged) {
			resource.masterData.current.description = description;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ key }: ProductSetKeyAction,
	) {
		resource.key = key;
		return resource;
	}

	setMetaDescription(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ metaDescription, staged }: ProductSetMetaDescriptionAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;
		resource.masterData.staged.metaDescription = metaDescription;
		if (!onlyStaged) {
			resource.masterData.current.metaDescription = metaDescription;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setMetaKeywords(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ metaKeywords, staged }: ProductSetMetaKeywordsAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;
		resource.masterData.staged.metaKeywords = metaKeywords;
		if (!onlyStaged) {
			resource.masterData.current.metaKeywords = metaKeywords;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setMetaTitle(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ metaTitle, staged }: ProductSetMetaTitleAction,
	) {
		const onlyStaged = staged !== undefined ? staged : true;
		resource.masterData.staged.metaTitle = metaTitle;
		if (!onlyStaged) {
			resource.masterData.current.metaTitle = metaTitle;
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setProductPriceCustomField(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ name, value, staged, priceId }: ProductSetProductPriceCustomFieldAction,
	) {
		const updatePriceCustomFields = (data: Writable<ProductData>) => {
			const price = [data.masterVariant, ...(data.variants ?? [])]
				.flatMap((variant) => variant.prices ?? [])
				.find((price) => price.id === priceId);

			if (!price) {
				throw new Error(
					`Price with id ${priceId} not found on product ${resource.id}`,
				);
			}
			if (price.custom) {
				if (value === null) {
					delete price.custom.fields[name];
				} else {
					price.custom.fields[name] = value;
				}
			}
			return data;
		};

		resource.masterData.staged = updatePriceCustomFields(
			resource.masterData.staged,
		);

		const onlyStaged = staged !== undefined ? staged : true;
		if (!onlyStaged) {
			resource.masterData.current = updatePriceCustomFields(
				resource.masterData.current,
			);
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setProductPriceCustomType(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ type, fields, staged, priceId }: ProductSetProductPriceCustomTypeAction,
	) {
		const updatePriceCustomType = (data: Writable<ProductData>) => {
			const price = [data.masterVariant, ...(data.variants ?? [])]
				.flatMap((variant) => variant.prices ?? [])
				.find((price) => price.id === priceId);

			if (price) {
				if (type) {
					price.custom = createCustomFields(
						{ type, fields },
						context.projectKey,
						this._storage,
					);
				} else {
					price.custom = undefined;
				}
			} else {
				throw new Error(
					`Price with id ${priceId} not found on product ${resource.id}`,
				);
			}
			return data;
		};

		resource.masterData.staged = updatePriceCustomType(
			resource.masterData.staged,
		);

		const onlyStaged = staged !== undefined ? staged : true;
		if (!onlyStaged) {
			resource.masterData.current = updatePriceCustomType(
				resource.masterData.current,
			);
		}
		checkForStagedChanges(resource);
		return resource;
	}

	setTaxCategory(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ taxCategory }: ProductSetTaxCategoryAction,
	) {
		let taxCategoryReference: TaxCategoryReference | undefined = undefined;
		if (taxCategory) {
			taxCategoryReference =
				getReferenceFromResourceIdentifier<TaxCategoryReference>(
					taxCategory,
					context.projectKey,
					this._storage,
				);
		} else {
			throw new CommercetoolsError<InvalidJsonInputError>(
				{
					code: "InvalidJsonInput",
					message: "Request body does not contain valid JSON.",
					detailedErrorMessage:
						"actions -> taxCategory: Missing required value",
				},
				400,
			);
		}
		resource.taxCategory = taxCategoryReference;
		return resource;
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<Product>,
		{ state, force }: ProductTransitionStateAction,
	) {
		let productStateReference: StateReference | undefined = undefined;
		if (state) {
			productStateReference =
				getReferenceFromResourceIdentifier<StateReference>(
					state,
					context.projectKey,
					this._storage,
				);
			resource.state = productStateReference;
		} else {
			throw new CommercetoolsError<InvalidJsonInputError>(
				{
					code: "InvalidJsonInput",
					message: "Request body does not contain valid JSON.",
					detailedErrorMessage: "actions -> state: Missing required value",
				},
				400,
			);
		}

		return resource;
	}

	unpublish(
		context: RepositoryContext,
		resource: Writable<Product>,
		// { action }: ProductUnpublishAction
	) {
		resource.masterData.published = false;
		checkForStagedChanges(resource);
	}

	// 'setPrices': () => {},
	// 'setDiscountedPrice': () => {},
	// 'setAttributeInAllVariants': () => {},
	// 'setCategoryOrderHint': () => {},
	// 'setSku': () => {},
	// 'setProductVariantKey': () => {},
	// 'setImageLabel': () => {},
	// 'addAsset': () => {},
	// 'removeAsset': () => {},
	// 'setAssetKey': () => {},
	// 'changeAssetOrder': () => {},
	// 'changeAssetName': () => {},
	// 'setAssetDescription': () => {},
	// 'setAssetTags': () => {},
	// 'setAssetSources': () => {},
	// 'setAssetCustomType': () => {},
	// 'setAssetCustomField': () => {},
	// 'setSearchKeywords': () => {},
	// 'revertStagedChanges': () => {},
	// 'revertStagedVariantChanges': () => {},
}
