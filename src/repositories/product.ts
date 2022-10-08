import {
  Price,
  PriceDraft,
  Product,
  ProductData,
  ProductDraft,
  ProductPublishAction,
  ProductSetAttributeAction,
  ProductTypeReference,
  ProductVariant,
  ProductVariantDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties, cloneObject } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from '../types'
import { getReferenceFromResourceIdentifier } from './helpers'
import deepEqual from 'deep-equal'

export class ProductRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'product'
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

    const productData: ProductData = {
      name: draft.name,
      slug: draft.slug,
      categories: [],
      masterVariant: variantFromDraft(1, draft.masterVariant),
      variants:
        draft.variants?.map((variant, index) =>
          variantFromDraft(index + 2, variant)
        ) ?? [],

      searchKeywords: draft.searchKeywords ?? {},
    }

    const resource: Product = {
      ...getBaseResourceProperties(),
      productType: productType,
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

  actions = {
    publish: (
      context: RepositoryContext,
      resource: Writable<Product>,
      { scope }: ProductPublishAction
    ) => {
      resource.masterData.current = getStagedData(resource)
      resource.masterData.published = true
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
      const isStaged = staged !== undefined ? staged : true

      // Write the attribute to the staged data
      const stagedData = getStagedData(resource)
      setAttr(stagedData)

      // Also write to published data is isStaged = false
      // if isStaged is false we set the attribute on both the staged and
      // published data.
      if (!isStaged) {
        setAttr(resource.masterData.current)
      }
      checkForStagedChanges(resource)

      return resource
    },
    // 'setKey': () => {},
    // 'changeName': () => {},
    // 'setDescription': () => {},
    // 'changeSlug': () => {},
    // 'addVariant': () => {},
    // 'removeVariant': () => {},
    // 'changeMasterVariant': () => {},
    // 'addPrice': () => {},
    // 'setPrices': () => {},
    // 'changePrice': () => {},
    // 'removePrice': () => {},
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
    // 'addExternalImage': () => {},
    // 'moveImageToPosition': () => {},
    // 'removeImage': () => {},
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
    // 'unpublish': () => {},
    // 'transitionState': () => {},
  }
}

// Return staged data. If no staged data is set we copy the current data
const getStagedData = (product: Writable<Product>) => {
  if (!product.masterData.staged) {
    product.masterData.staged = cloneObject(product.masterData.current)
  }
  return product.masterData.staged
}

// Check if the product still has staged data that is different from the
// current data.
const checkForStagedChanges = (product: Writable<Product>) => {
  if (!product.masterData.staged) {
    product.masterData.staged = getStagedData(product)
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
  attributes: variant?.attributes ?? [],
  prices: variant?.prices?.map(priceFromDraft),
  assets: [],
  images: [],
})

const priceFromDraft = (draft: PriceDraft): Price => ({
  id: uuidv4(),
  value: {
    currencyCode: draft.value.currencyCode,
    centAmount: draft.value.centAmount,
    fractionDigits: 2,
    type: 'centPrecision',
  },
})
