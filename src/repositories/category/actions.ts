import {
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
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { Writable } from "~src/types";
import {
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "../abstract";
import { createCustomFields } from "../helpers";

export class CategoryUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Category, CategoryUpdateAction>>
{
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

	changeSlug(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ slug }: CategoryChangeSlugAction,
	) {
		resource.slug = slug;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ name }: CategoryChangeNameAction,
	) {
		resource.name = name;
	}

	changeParent(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ parent }: CategoryChangeParentAction,
	) {
		const category = this._storage.getByResourceIdentifier(
			context.projectKey,
			parent,
		);
		if (!category) {
			throw new Error("No category found for reference");
		}
		resource.parent = {
			typeId: "category",
			id: category.id,
		};
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ key }: CategorySetKeyAction,
	) {
		resource.key = key;
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

	setDescription(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ description }: CategorySetDescriptionAction,
	) {
		resource.description = description;
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

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ type, fields }: CategorySetCustomTypeAction,
	) {
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ name, value }: CategorySetCustomFieldAction,
	) {
		if (!resource.custom) {
			return;
		}
		if (value === null) {
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
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
			resource.assets = resource.assets.filter(function (obj) {
				return obj.id !== assetId;
			});

			return;
		}

		if (assetKey) {
			resource.assets = resource.assets.filter(function (obj) {
				return obj.key !== assetKey;
			});

			return;
		}
	}

	addAsset(
		context: RepositoryContext,
		resource: Writable<Category>,
		{ asset }: CategoryAddAssetAction,
	) {
		if (!resource.assets) {
			resource.assets = [this.assetFromAssetDraft(asset, context)];
		} else {
			resource.assets.push(this.assetFromAssetDraft(asset, context));
		}
	}

	assetFromAssetDraft = (
		draft: AssetDraft,
		context: RepositoryContext,
	): Asset => ({
		...draft,
		id: uuidv4(),
		custom: createCustomFields(draft.custom, context.projectKey, this._storage),
	});
}
