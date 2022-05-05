import { v4 as uuidv4 } from 'uuid'
import {
  Category,
  CategoryChangeAssetNameAction,
  CategoryChangeSlugAction,
  CategoryDraft,
  CategorySetAssetDescriptionAction,
  CategorySetAssetSourcesAction,
  CategorySetDescriptionAction,
  CategorySetKeyAction,
  CategorySetMetaDescriptionAction,
  CategorySetMetaKeywordsAction,
  CategorySetMetaTitleAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { createCustomFields } from './helpers'
import { AbstractResourceRepository } from './abstract'

export class CategoryRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'category'
  }

  create(projectKey: string, draft: CategoryDraft): Category {
    const resource: Category = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      slug: draft.slug,
      orderHint: draft.orderHint || '',
      externalId: draft.externalId || '',
      parent: draft.parent
        ? { typeId: 'category', id: draft.parent.id! }
        : undefined,
      ancestors: [], // TODO
      assets:
        draft.assets?.map(d => {
          return {
            id: uuidv4(),
            name: d.name,
            description: d.description,
            sources: d.sources,
            tags: d.tags,
            key: d.key,
            custom: createCustomFields(draft.custom, projectKey, this._storage),
          }
        }) || [],
    }
    this.save(projectKey, resource)
    return resource
  }

  actions = {
    changeAssetName: (
      projectKey: string,
      resource: Writable<Category>,
      { assetId, assetKey, name }: CategoryChangeAssetNameAction
    ) => {
      resource.assets?.forEach(asset => {
        if (assetId && assetId == asset.id) {
          asset.name = name
        }
        if (assetKey && assetKey == asset.key) {
          asset.name = name
        }
      })
    },
    changeSlug: (
      projectKey: string,
      resource: Writable<Category>,
      { slug }: CategoryChangeSlugAction
    ) => {
      resource.slug = slug
    },
    setKey: (
      projectKey: string,
      resource: Writable<Category>,
      { key }: CategorySetKeyAction
    ) => {
      resource.key = key
    },
    setAssetDescription: (
      projectKey: string,
      resource: Writable<Category>,
      { assetId, assetKey, description }: CategorySetAssetDescriptionAction
    ) => {
      resource.assets?.forEach(asset => {
        if (assetId && assetId == asset.id) {
          asset.description = description
        }
        if (assetKey && assetKey == asset.key) {
          asset.description = description
        }
      })
    },
    setAssetSources: (
      projectKey: string,
      resource: Writable<Category>,
      { assetId, assetKey, sources }: CategorySetAssetSourcesAction
    ) => {
      resource.assets?.forEach(asset => {
        if (assetId && assetId == asset.id) {
          asset.sources = sources
        }
        if (assetKey && assetKey == asset.key) {
          asset.sources = sources
        }
      })
    },
    setDescription: (
      projectKey: string,
      resource: Writable<Category>,
      { description }: CategorySetDescriptionAction
    ) => {
      resource.description = description
    },
    setMetaDescription: (
      projectKey: string,
      resource: Writable<Category>,
      { metaDescription }: CategorySetMetaDescriptionAction
    ) => {
      resource.metaDescription = metaDescription
    },
    setMetaKeywords: (
      projectKey: string,
      resource: Writable<Category>,
      { metaKeywords }: CategorySetMetaKeywordsAction
    ) => {
      resource.metaKeywords = metaKeywords
    },
    setMetaTitle: (
      projectKey: string,
      resource: Writable<Category>,
      { metaTitle }: CategorySetMetaTitleAction
    ) => {
      resource.metaTitle = metaTitle
    },
  }
}
