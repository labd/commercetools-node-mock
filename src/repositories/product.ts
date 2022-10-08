import {
  Price,
  PriceDraft,
  Product,
  ProductData,
  ProductDraft,
  ProductPublishAction,
  ProductSetAttributeAction,
  ProductType,
  ProductTypeReference,
  ProductVariant,
  ProductVariantDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from '../types'
import { getReferenceFromResourceIdentifier } from './helpers'

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
        draft.variants?.map((variant, index) => {
          return variantFromDraft(index + 2, variant)
        }) ?? [],

      // @ts-ignore
      searchKeywords: draft.searchKeywords,
    }

    const resource: Product = {
      ...getBaseResourceProperties(),
      productType: productType,
      masterData: {
        // @ts-ignore
        current: draft.publish ? productData : undefined,
        // @ts-ignore
        staged: draft.publish ? undefined : productData,
        hasStagedChanges: draft.publish ?? true,
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
      if (resource.masterData.staged) {
        resource.masterData.current = resource.masterData.staged
        // @ts-ignore
        resource.masterData.staged = undefined
      }
      resource.masterData.hasStagedChanges = false
      resource.masterData.published = true
    },
    setAttribute: (
      context: RepositoryContext,
      resource: Writable<Product>,
      { variantId, sku, name, value, staged }: ProductSetAttributeAction
    ) => {
      const isStaged = staged !== undefined ? staged : false
      const productData = getProductData(resource, isStaged)
      const { variant, isMasterVariant, variantIndex } = getVariant(
        productData,
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

      const existingAttr = variant.attributes.find(attr => attr.name === name)
      if (existingAttr) {
        existingAttr.value = value
      } else {
        variant.attributes.push({
          name,
          value,
        })
      }
      if (isStaged) {
        resource.masterData.staged = productData
        if (isMasterVariant) {
          resource.masterData.staged.masterVariant = variant
        } else {
          resource.masterData.staged.variants[variantIndex] = variant
        }
        resource.masterData.hasStagedChanges = true
      } else {
        resource.masterData.current = productData
        if (isMasterVariant) {
          resource.masterData.current.masterVariant = variant
        } else {
          resource.masterData.current.variants[variantIndex] = variant
        }
      }
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

const getProductData = (product: Product, staged: boolean) => {
  if (!staged && product.masterData.current) {
    return product.masterData.current
  }
  return product.masterData.staged
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
): ProductVariant => {
  return {
    id: variantId,
    sku: variant?.sku,
    attributes: variant?.attributes ?? [],
    prices: variant?.prices?.map(priceFromDraft),
    assets: [],
    images: [],
  }
}

const priceFromDraft = (draft: PriceDraft): Price => {
  return {
    id: uuidv4(),
    value: {
      currencyCode: draft.value.currencyCode,
      centAmount: draft.value.centAmount,
      fractionDigits: 2,
      type: 'centPrecision',
    },
  }
}
