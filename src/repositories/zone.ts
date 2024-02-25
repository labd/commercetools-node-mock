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
import { getBaseResourceProperties } from "../helpers";
import { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "./abstract";

export class ZoneRepository extends AbstractResourceRepository<"zone"> {
	constructor(storage: AbstractStorage) {
		super("zone", storage);
		this.actions = new ZoneUpdateHandler(storage);
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

	changeName(
		context: RepositoryContext,
		resource: Writable<Zone>,
		{ name }: ZoneChangeNameAction,
	) {
		resource.name = name;
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
