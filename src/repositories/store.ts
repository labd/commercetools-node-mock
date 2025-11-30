import type {
	ChannelReference,
	ChannelResourceIdentifier,
	Store,
	StoreDraft,
	StoreSetCountriesAction,
	StoreSetCustomFieldAction,
	StoreSetCustomTypeAction,
	StoreSetDistributionChannelsAction,
	StoreSetLanguagesAction,
	StoreSetNameAction,
	StoreUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { AbstractStorage } from "../storage/abstract.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "./helpers.ts";

export class StoreRepository extends AbstractResourceRepository<"store"> {
	constructor(config: Config) {
		super("store", config);
		this.actions = new StoreUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: StoreDraft): Store {
		const resource: Store = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			languages: draft.languages ?? [],
			countries: draft.countries ?? [],
			distributionChannels: transformChannels(
				context,
				this._storage,
				draft.distributionChannels,
			),
			supplyChannels: transformChannels(
				context,
				this._storage,
				draft.supplyChannels,
			),
			productSelections: [],
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}

const transformChannels = (
	context: RepositoryContext,
	storage: AbstractStorage,
	channels?: ChannelResourceIdentifier[],
) => {
	if (!channels) return [];

	return channels.map((ref) =>
		getReferenceFromResourceIdentifier<ChannelReference>(
			ref,
			context.projectKey,
			storage,
		),
	);
};

class StoreUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Store, StoreUpdateAction>>
{
	setCountries(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ countries }: StoreSetCountriesAction,
	) {
		resource.countries = countries ?? [];
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ name, value }: StoreSetCustomFieldAction,
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

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ type, fields }: StoreSetCustomTypeAction,
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

	setDistributionChannels(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ distributionChannels }: StoreSetDistributionChannelsAction,
	) {
		resource.distributionChannels = transformChannels(
			context,
			this._storage,
			distributionChannels,
		);
	}

	setLanguages(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ languages }: StoreSetLanguagesAction,
	) {
		resource.languages = languages ?? [];
	}

	setName(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ name }: StoreSetNameAction,
	) {
		resource.name = name;
	}
}
