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
import { StoreDraftSchema } from "#src/schemas/generated/store.ts";
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
		this.draftSchema = StoreDraftSchema;
	}

	async create(context: RepositoryContext, draft: StoreDraft): Promise<Store> {
		const resource: Store = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			languages: draft.languages ?? [],
			countries: draft.countries ?? [],
			distributionChannels: await transformChannels(
				context,
				this._storage,
				draft.distributionChannels,
			),
			supplyChannels: await transformChannels(
				context,
				this._storage,
				draft.supplyChannels,
			),
			productSelections: [],
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return await this.saveNew(context, resource);
	}
}

const transformChannels = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	channels?: ChannelResourceIdentifier[],
) => {
	if (!channels) return [];

	return Promise.all(
		channels.map((ref) =>
			getReferenceFromResourceIdentifier<ChannelReference>(
				ref,
				context.projectKey,
				storage,
			),
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
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ type, fields }: StoreSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	async setDistributionChannels(
		context: RepositoryContext,
		resource: Writable<Store>,
		{ distributionChannels }: StoreSetDistributionChannelsAction,
	) {
		resource.distributionChannels = await transformChannels(
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
