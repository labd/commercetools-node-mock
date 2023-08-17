import type {
	Asset,
	AssetDraft,
	Category,
	CategoryAddAssetAction,
	CategoryChangeAssetNameAction,
	CategoryChangeSlugAction,
	CategoryDraft,
	CategoryRemoveAssetAction,
	CategorySetAssetDescriptionAction,
	CategorySetAssetSourcesAction,
	CategorySetCustomFieldAction,
	CategorySetCustomTypeAction,
	CategorySetDescriptionAction,
	CategorySetKeyAction,
	CategorySetMetaDescriptionAction,
	CategorySetMetaKeywordsAction,
	CategorySetMetaTitleAction,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from './abstract.js'
import { createCustomFields } from './helpers.js'

export class CategoryRepository extends AbstractResourceRepository<'category'> {
	getTypeId() {
		return 'category' as const
	}

	assetFromAssetDraft = (
		draft: AssetDraft,
		context: RepositoryContext
	): Asset => ({
		...draft,
		id: uuidv4(),
		custom: createCustomFields(draft.custom, context.projectKey, this._storage),
	})

	create(context: RepositoryContext, draft: CategoryDraft): Category {
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
				draft.assets?.map((d) => ({
					id: uuidv4(),
					name: d.name,
					description: d.description,
					sources: d.sources,
					tags: d.tags,
					key: d.key,
					custom: createCustomFields(
						draft.custom,
						context.projectKey,
						this._storage
					),
				})) || [],
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage
			),
		}
		this.saveNew(context, resource)
		return resource
	}

	actions = {
		changeAssetName: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ assetId, assetKey, name }: CategoryChangeAssetNameAction
		) => {
			resource.assets?.forEach((asset) => {
				if (assetId && assetId === asset.id) {
					asset.name = name
				}
				if (assetKey && assetKey === asset.key) {
					asset.name = name
				}
			})
		},
		changeSlug: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ slug }: CategoryChangeSlugAction
		) => {
			resource.slug = slug
		},
		setKey: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ key }: CategorySetKeyAction
		) => {
			resource.key = key
		},
		setAssetDescription: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ assetId, assetKey, description }: CategorySetAssetDescriptionAction
		) => {
			resource.assets?.forEach((asset) => {
				if (assetId && assetId === asset.id) {
					asset.description = description
				}
				if (assetKey && assetKey === asset.key) {
					asset.description = description
				}
			})
		},
		setAssetSources: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ assetId, assetKey, sources }: CategorySetAssetSourcesAction
		) => {
			resource.assets?.forEach((asset) => {
				if (assetId && assetId === asset.id) {
					asset.sources = sources
				}
				if (assetKey && assetKey === asset.key) {
					asset.sources = sources
				}
			})
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ description }: CategorySetDescriptionAction
		) => {
			resource.description = description
		},
		setMetaDescription: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ metaDescription }: CategorySetMetaDescriptionAction
		) => {
			resource.metaDescription = metaDescription
		},
		setMetaKeywords: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ metaKeywords }: CategorySetMetaKeywordsAction
		) => {
			resource.metaKeywords = metaKeywords
		},
		setMetaTitle: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ metaTitle }: CategorySetMetaTitleAction
		) => {
			resource.metaTitle = metaTitle
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ type, fields }: CategorySetCustomTypeAction
		) => {
			if (type) {
				resource.custom = createCustomFields(
					{ type, fields },
					context.projectKey,
					this._storage
				)
			} else {
				resource.custom = undefined
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ name, value }: CategorySetCustomFieldAction
		) => {
			if (!resource.custom) {
				return
			}
			if (value === null) {
				delete resource.custom.fields[name]
			} else {
				resource.custom.fields[name] = value
			}
		},
		removeAsset: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ assetId, assetKey }: CategoryRemoveAssetAction
		) => {
			if (!resource.assets) {
				return
			}

			if (assetId) {
				resource.assets = resource.assets.filter(function (obj) {
					return obj.id !== assetId
				})

				return
			}

			if (assetKey) {
				resource.assets = resource.assets.filter(function (obj) {
					return obj.key !== assetKey
				})

				return
			}
		},
		addAsset: (
			context: RepositoryContext,
			resource: Writable<Category>,
			{ asset }: CategoryAddAssetAction
		) => {
			if (!resource.assets) {
				resource.assets = [this.assetFromAssetDraft(asset, context)]
			} else {
				resource.assets.push(this.assetFromAssetDraft(asset, context))
			}
		},
	}
}
