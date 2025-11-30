import type {
	Zone,
	ZoneAddLocationAction,
	ZoneChangeNameAction,
	ZoneDraft,
	ZoneRemoveLocationAction,
	ZoneSetDescriptionAction,
	ZoneSetKeyAction,
	ZoneUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";

export class ZoneRepository extends AbstractResourceRepository<"zone"> {
	constructor(config: Config) {
		super("zone", config);
		this.actions = new ZoneUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: ZoneDraft): Zone {
		const resource: Zone = {
			...getBaseResourceProperties(),
			key: draft.key,
			locations: draft.locations || [],
			name: draft.name,
			description: draft.description,
		};
		return this.saveNew(context, resource);
	}
}

class ZoneUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Zone, ZoneUpdateAction>>
{
	addLocation(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ location }: ZoneAddLocationAction,
	) {
		resource.locations.push(location);
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ name }: ZoneChangeNameAction,
	) {
		resource.name = name;
	}

	removeLocation(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ location }: ZoneRemoveLocationAction,
	) {
		resource.locations = resource.locations.filter(
			(loc) =>
				!(loc.country === location.country && loc.state === location.state),
		);
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ description }: ZoneSetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ key }: ZoneSetKeyAction,
	) {
		resource.key = key;
	}
}
