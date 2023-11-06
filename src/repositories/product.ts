import type {
	Price,
	PriceDraft,
	Product,
	ProductData,
	ProductDraft,
	ProductPublishAction,
	ProductSetAttributeAction,
	ProductSetDescriptionAction,
	ProductAddExternalImageAction,
	ProductRemoveImageAction,
	ProductSetKeyAction,
	ProductTypeReference,
	ProductUpdateAction,
	ProductVariant,
	ProductVariantDraft,
	ProductMoveImageToPositionAction,
	ProductChangePriceAction,
	ProductAddPriceAction,
	ProductRemovePriceAction,
	CategoryReference,
	TaxCategoryReference,
	StateReference,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import type { Writable } from '../types.js'
import { getBaseResourceProperties } from '../helpers.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import {
	createTypedMoney,
	getReferenceFromResourceIdentifier,
} from './helpers.js'
import deepEqual from 'deep-equal'

export class ProductRepository extends AbstractResourceRepository<'product'> {
	getTypeId() {
		return 'product' as const
	}

	create(context: RepositoryContext, draft: ProductDraft): Product {
		if (!draft.masterVariant) {
			throw new Error('Missing master variant')
		}

		let productType: ProductTypeReference | undefined = undefined
		try {
			productType = getReferenceFromResourceIdentifier<ProductTypeReference>(
				draft.productType,
				context.projectKey,
				this._storage
			)
		} catch (err) {
			// For now accept missing product types (but warn)
			console.warn(
				`Error resolving product-type '${draft.productType.id}'. This will be throw an error in later releases.`
			)
			productType = {
				typeId: 'product-type',
				id: draft.productType.id || '',
			}
		}

		// Resolve Product categories
		const categoryReferences: CategoryReference[] = []
		draft.categories?.forEach((category) => {
			try {
				categoryReferences.push(
					getReferenceFromResourceIdentifier<CategoryReference>(
						category,
						context.projectKey,
						this._storage
					)
				)
			} catch (err) {
				throw new Error(`Error resolving category '${category}'.`)
			}
		})

		// Resolve Tax category
		let taxCategoryReference: TaxCategoryReference | undefined = undefined
		if (draft.taxCategory) {
			try {
				taxCategoryReference =
					getReferenceFromResourceIdentifier<TaxCategoryReference>(
						draft.taxCategory,
						context.projectKey,
						this._storage
					)
			} catch (err) {
				throw new Error(
					`Error resolving tax category with key '${draft.taxCategory}'.`
				)
			}
		}

		// Resolve Product State
		let productStateReference: StateReference | undefined = undefined
		if (draft.state) {
			try {
				productStateReference =
					getReferenceFromResourceIdentifier<StateReference>(
						draft.state,
						context.projectKey,
						this._storage
					)
			} catch (err) {
				throw new Error(`Error resolving state '${draft.state}'.`)
			}
		}

		const productData: ProductData = {
			name: draft.name,
			slug: draft.slug,
			description: draft.description,
			categories: categoryReferences,
			masterVariant: variantFromDraft(1, draft.masterVariant),
			variants:
				draft.variants?.map((variant, index) =>
					variantFromDraft(index + 2, variant)
				) ?? [],
			metaTitle: draft.metaTitle,
			metaDescription: draft.metaDescription,
			metaKeywords: draft.metaKeywords,
			searchKeywords: draft.searchKeywords ?? {},
		}

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
		}

		this.saveNew(context, resource)

		return resource
	}

	actions: Partial<
		Record<
			ProductUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<Product>,
				action: any
			) => void
		>
	> = {
		publish: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ scope }: ProductPublishAction
		) => {
			resource.masterData.current = resource.masterData.staged
			resource.masterData.published = true
			checkForStagedChanges(resource)
		},
		unpublish: (
			context: RepositoryContext,
			resource: Writable<Product>
			// { action }: ProductUnpublishAction
		) => {
			resource.masterData.published = false
			checkForStagedChanges(resource)
		},
		setAttribute: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ variantId, sku, name, value, staged }: ProductSetAttributeAction
		) => {
			const setAttr = (data: Writable<ProductData>) => {
				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					variantId,
					sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`
					)
				}

				if (!variant.attributes) {
					variant.attributes = []
				}

				const existingAttr = variant.attributes.find(
					(attr) => attr.name === name
				)
				if (existingAttr) {
					existingAttr.value = value
				} else {
					variant.attributes.push({
						name,
						value,
					})
				}
				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			setAttr(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				setAttr(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ description, staged }: ProductSetDescriptionAction
		) => {
			const onlyStaged = staged !== undefined ? staged : true

			resource.masterData.staged.description = description
			if (!onlyStaged) {
				resource.masterData.current.description = description
			}
			checkForStagedChanges(resource)
			return resource
		},
		setKey: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ key }: ProductSetKeyAction
		) => {
			resource.key = key
			return resource
		},
		addExternalImage: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ variantId, sku, image, staged }: ProductAddExternalImageAction
		) => {
			const addImg = (data: Writable<ProductData>) => {
				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					variantId,
					sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`
					)
				}

				if (!variant.images) {
					variant.images = []
				} else {
					const existingImage = variant.images.find((x) => x.url === image.url)
					if (existingImage) {
						throw new Error(
							`Cannot add image '${image.url}' because product '${resource.id}' already has that image.`
						)
					}
				}

				// Add image
				variant.images.push(image)

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			addImg(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				addImg(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},
		removeImage: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ variantId, sku, imageUrl, staged }: ProductRemoveImageAction
		) => {
			const removeImg = (data: Writable<ProductData>) => {
				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					variantId,
					sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`
					)
				}

				const variantImages = variant.images ?? []
				const existingImage = variantImages.find((x) => x.url === imageUrl)
				if (!existingImage) {
					throw new Error(
						`Cannot remove image '${imageUrl}' because product '${resource.id}' does not have that image.`
					)
				}

				// Remove image
				variant.images = variantImages.filter((image) => image.url !== imageUrl)

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			removeImg(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				removeImg(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},
		moveImageToPosition: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{
				variantId,
				sku,
				imageUrl,
				position,
				staged,
			}: ProductMoveImageToPositionAction
		) => {
			const moveImg = (data: Writable<ProductData>) => {
				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					variantId,
					sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`
					)
				}

				const variantImages = variant.images ?? []
				const existingImage = variantImages.find((x) => x.url === imageUrl)
				if (!existingImage) {
					throw new Error(
						`Cannot move image '${imageUrl}' because product '${resource.id}' does not have that image.`
					)
				}

				if (position >= variantImages.length) {
					throw new Error(
						`Invalid position given. Position in images where the image should be moved. Must be between 0 and the total number of images minus 1.`
					)
				}

				// Remove image
				variant.images = variantImages.filter((image) => image.url !== imageUrl)

				// Re-add image to the correct position
				variant.images.splice(position, 0, existingImage)

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			moveImg(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				moveImg(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},

		addPrice: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ variantId, sku, price, staged }: ProductAddPriceAction
		) => {
			const addVariantPrice = (data: Writable<ProductData>) => {
				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					variantId,
					sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${variantId} or sku ${sku} not found on product ${resource.id}`
					)
				}

				if (variant.prices === undefined) {
					variant.prices = [priceFromDraft(price)]
				} else {
					variant.prices.push(priceFromDraft(price))
				}

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			addVariantPrice(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				addVariantPrice(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},
		changePrice: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ priceId, price, staged }: ProductChangePriceAction
		) => {
			const changeVariantPrice = (data: Writable<ProductData>) => {
				const allVariants = [data.masterVariant, ...(data.variants ?? [])]
				const priceVariant = allVariants.find(
					(variant) => variant.prices?.some((x) => x.id === priceId)
				)
				if (!priceVariant) {
					throw new Error(
						`Price with id ${priceId} not found on product ${resource.id}`
					)
				}

				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					priceVariant.id,
					priceVariant.sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${priceVariant.id} or sku ${priceVariant.sku} not found on product ${resource.id}`
					)
				}

				variant.prices = variant.prices?.map((x) => {
					if (x.id === priceId) {
						return { ...x, ...price } as Price
					}
					return x
				})

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			changeVariantPrice(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				changeVariantPrice(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},
		removePrice: (
			context: RepositoryContext,
			resource: Writable<Product>,
			{ priceId, staged }: ProductRemovePriceAction
		) => {
			const removeVariantPrice = (data: Writable<ProductData>) => {
				const allVariants = [data.masterVariant, ...(data.variants ?? [])]
				const priceVariant = allVariants.find(
					(variant) => variant.prices?.some((x) => x.id === priceId)
				)
				if (!priceVariant) {
					throw new Error(
						`Price with id ${priceId} not found on product ${resource.id}`
					)
				}

				const { variant, isMasterVariant, variantIndex } = getVariant(
					data,
					priceVariant.id,
					priceVariant.sku
				)
				if (!variant) {
					throw new Error(
						`Variant with id ${priceVariant.id} or sku ${priceVariant.sku} not found on product ${resource.id}`
					)
				}

				variant.prices = variant.prices?.filter((x) => x.id !== priceId)

				if (isMasterVariant) {
					data.masterVariant = variant
				} else {
					data.variants[variantIndex] = variant
				}
			}

			// If true, only the staged Attribute is set. If false, both current and
			// staged Attribute is set.  Default is true
			const onlyStaged = staged !== undefined ? staged : true

			// Write the attribute to the staged data
			removeVariantPrice(resource.masterData.staged)

			// Also write to published data is isStaged = false
			// if isStaged is false we set the attribute on both the staged and
			// published data.
			if (!onlyStaged) {
				removeVariantPrice(resource.masterData.current)
			}
			checkForStagedChanges(resource)

			return resource
		},

		// 'changeName': () => {},
		// 'changeSlug': () => {},
		// 'addVariant': () => {},
		// 'removeVariant': () => {},
		// 'changeMasterVariant': () => {},
		// 'setPrices': () => {},
		// 'setProductPriceCustomType': () => {},
		// 'setProductPriceCustomField': () => {},
		// 'setDiscountedPrice': () => {},
		// 'setAttributeInAllVariants': () => {},
		// 'addToCategory': () => {},
		// 'setCategoryOrderHint': () => {},
		// 'removeFromCategory': () => {},
		// 'setTaxCategory': () => {},
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
		// 'setMetaTitle': () => {},
		// 'setMetaDescription': () => {},
		// 'setMetaKeywords': () => {},
		// 'revertStagedChanges': () => {},
		// 'revertStagedVariantChanges': () => {},
		// 'transitionState': () => {},
	}
}

// Check if the product still has staged data that is different from the
// current data.
const checkForStagedChanges = (product: Writable<Product>) => {
	if (!product.masterData.staged) {
		product.masterData.staged = product.masterData.current
	}

	if (deepEqual(product.masterData.current, product.masterData.staged)) {
		product.masterData.hasStagedChanges = false
	} else {
		product.masterData.hasStagedChanges = true
	}
}

interface VariantResult {
	variant: Writable<ProductVariant> | undefined
	isMasterVariant: boolean
	variantIndex: number
}

const getVariant = (
	productData: ProductData,
	variantId?: number,
	sku?: string
): VariantResult => {
	const variants = [productData.masterVariant, ...productData.variants]
	const foundVariant = variants.find((variant: ProductVariant) => {
		if (variantId) {
			return variant.id === variantId
		}
		if (sku) {
			return variant.sku === sku
		}
		return false
	})

	const isMasterVariant = foundVariant === productData.masterVariant
	return {
		variant: foundVariant,
		isMasterVariant,
		variantIndex:
			!isMasterVariant && foundVariant
				? productData.variants.indexOf(foundVariant)
				: -1,
	}
}

const variantFromDraft = (
	variantId: number,
	variant: ProductVariantDraft
): ProductVariant => ({
	id: variantId,
	sku: variant?.sku,
	key: variant?.key,
	attributes: variant?.attributes ?? [],
	prices: variant?.prices?.map(priceFromDraft),
	assets: [],
	images: [],
})

const priceFromDraft = (draft: PriceDraft): Price => ({
	id: uuidv4(),
	key: draft.key,
	country: draft.country,
	value: createTypedMoney(draft.value),
})
