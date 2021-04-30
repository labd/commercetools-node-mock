import {
  Product,
  ProductData,
  ProductDraft,
  ProductPublishAction,
  ProductSetAttributeAction,
  ProductVariant,
  ProductVariantDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'
import { Writable } from '../types'

export class ProductRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'product'
  }

  create(projectKey: string, draft: ProductDraft): Product {
    const productData = {
      name: draft.name,
      slug: draft.slug,
      categories: [],
      masterVariant:
        draft.masterVariant && variantFromDraft(0, draft.masterVariant!),
      variants:
        draft.variants &&
        draft.variants.map((variant, index) => {
          return variantFromDraft(index + 1, variant)
        }),

      // @ts-ignore
      searchKeywords: draft.searchKeywords,
    }

    const resource: Product = {
      ...getBaseResourceProperties(),
      masterData: {
        // @ts-ignore
        current: draft.publish ? productData : undefined,
        // @ts-ignore
        staged: draft.publish ? undefined : productData,
        hasStagedChanges: draft.publish ?? true,
        published: draft.publish ?? false,
      },
    }

    this.save(projectKey, resource)

    return resource
  }

  actions = {
    publish: (
      projectKey: string,
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
      projectKey: string,
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
    attributes: variant?.attributes,
  }
}
