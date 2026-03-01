import type {
	Channel,
	ChannelChangeDescriptionAction,
	ChannelChangeKeyAction,
	ChannelChangeNameAction,
	ChannelDraft,
	ChannelSetAddressAction,
	ChannelSetCustomFieldAction,
	ChannelSetCustomTypeAction,
	ChannelSetGeoLocationAction,
	ChannelUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { ChannelDraftSchema } from "#src/schemas/generated/channel.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import { createAddress, createCustomFields } from "./helpers.ts";

export class ChannelRepository extends AbstractResourceRepository<"channel"> {
	constructor(config: Config) {
		super("channel", config);
		this.actions = new ChannelUpdateHandler(this._storage);
		this.draftSchema = ChannelDraftSchema;
	}

	create(context: RepositoryContext, draft: ChannelDraft): Channel {
		const resource: Channel = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			roles: draft.roles || [],
			geoLocation: draft.geoLocation,
			address: createAddress(draft.address, context.projectKey, this._storage),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}

class ChannelUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Channel, ChannelUpdateAction>>
{
	changeDescription(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ description }: ChannelChangeDescriptionAction,
	) {
		resource.description = description;
	}

	changeKey(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ key }: ChannelChangeKeyAction,
	) {
		resource.key = key;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ name }: ChannelChangeNameAction,
	) {
		resource.name = name;
	}

	setAddress(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ address }: ChannelSetAddressAction,
	) {
		resource.address = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ name, value }: ChannelSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ type, fields }: ChannelSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}

	setGeoLocation(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ geoLocation }: ChannelSetGeoLocationAction,
	) {
		resource.geoLocation = geoLocation;
	}
}
