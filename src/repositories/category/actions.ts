import type {
	Asset,
	AssetDraft,
	Category,
	CategoryAddAssetAction,
	CategoryChangeAssetNameAction,
	CategoryChangeNameAction,
	CategoryChangeParentAction,
	CategoryChangeSlugAction,
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
	CategoryUpdateAction,
	ReferencedResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler } from "../abstract.ts";
import { createCustomFields } from "../helpers.ts";

export class CategoryUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Category, CategoryUpdateAction>>
{
	async addAsset(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ asset }: CategoryAddAssetAction,
	) {
		if (!resource.assets) {
			resource.assets = [await this.assetFromAssetDraft(asset, context)];
		} else {
			resource.assets.push(await this.assetFromAssetDraft(asset, context));
		}
	}

	changeAssetName(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ assetId, assetKey, name }: CategoryChangeAssetNameAction,
	) {
		resource.assets?.forEach((asset) => {
			if (assetId && assetId === asset.id) {
				asset.name = name;
			}
			if (assetKey && assetKey === asset.key) {
				asset.name = name;
			}
		});
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ name }: CategoryChangeNameAction,
	) {
		resource.name = name;
	}

	async changeParent(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ parent }: CategoryChangeParentAction,
	) {
		const category = await this._storage.getByResourceIdentifier(
			context.projectKey,
			parent,
		);
		if (!category) {
			throw new CommercetoolsError<ReferencedResourceNotFoundError>(
				{
					code: "ReferencedResourceNotFound",
					message: "No category found for reference",
					typeId: "category",
					id: parent.id,
					key: parent.key,
				},
				400,
			);
		}
		resource.parent = {
			typeId: "category",
			id: category.id,
		};
	}

	changeSlug(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ slug }: CategoryChangeSlugAction,
	) {
		resource.slug = slug;
	}

	removeAsset(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ assetId, assetKey }: CategoryRemoveAssetAction,
	) {
		if (!resource.assets) {
			return;
		}

		if (assetId) {
			resource.assets = resource.assets.filter((obj) => obj.id !== assetId);

			return;
		}

		if (assetKey) {
			resource.assets = resource.assets.filter((obj) => obj.key !== assetKey);

			return;
		}
	}

	setAssetDescription(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ assetId, assetKey, description }: CategorySetAssetDescriptionAction,
	) {
		resource.assets?.forEach((asset) => {
			if (assetId && assetId === asset.id) {
				asset.description = description;
			}
			if (assetKey && assetKey === asset.key) {
				asset.description = description;
			}
		});
	}

	setAssetSources(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ assetId, assetKey, sources }: CategorySetAssetSourcesAction,
	) {
		resource.assets?.forEach((asset) => {
			if (assetId && assetId === asset.id) {
				asset.sources = sources;
			}
			if (assetKey && assetKey === asset.key) {
				asset.sources = sources;
			}
		});
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ name, value }: CategorySetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ type, fields }: CategorySetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ description }: CategorySetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ key }: CategorySetKeyAction,
	) {
		resource.key = key;
	}

	setMetaDescription(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ metaDescription }: CategorySetMetaDescriptionAction,
	) {
		resource.metaDescription = metaDescription;
	}

	setMetaKeywords(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ metaKeywords }: CategorySetMetaKeywordsAction,
	) {
		resource.metaKeywords = metaKeywords;
	}

	setMetaTitle(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ metaTitle }: CategorySetMetaTitleAction,
	) {
		resource.metaTitle = metaTitle;
	}

	assetFromAssetDraft = async (
		draft: AssetDraft,
		context: RepositoryContext,
	): Promise<Asset> => ({
		...draft,
		id: uuidv4(),
		custom: await createCustomFields(
			draft.custom,
			context.projectKey,
			this._storage,
		),
	});
}
