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
	}

	create(context: RepositoryContext, draft: ChannelDraft): Channel {
		const resource: Channel = {
			...getBaseResourceProperties(),
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
		resource: Writable<Channel>,
		{ type, fields }: ChannelSetCustomTypeAction,
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

	setGeoLocation(
		context: RepositoryContext,
		resource: Writable<Channel>,
		{ geoLocation }: ChannelSetGeoLocationAction,
	) {
		resource.geoLocation = geoLocation;
	}
}
