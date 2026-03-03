import type {
	State,
	StateAddRolesAction,
	StateChangeInitialAction,
	StateChangeKeyAction,
	StateChangeTypeAction,
	StateDraft,
	StateReference,
	StateRemoveRolesAction,
	StateSetDescriptionAction,
	StateSetNameAction,
	StateSetRolesAction,
	StateSetTransitionsAction,
	StateUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { StateDraftSchema } from "#src/schemas/generated/state.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";
import { getReferenceFromResourceIdentifier } from "./helpers.ts";

export class StateRepository extends AbstractResourceRepository<"state"> {
	constructor(config: Config) {
		super("state", config);
		this.actions = new StateUpdateHandler(config.storage);
		this.draftSchema = StateDraftSchema;
	}

	async create(context: RepositoryContext, draft: StateDraft): Promise<State> {
		const transitions = await Promise.all(
			(draft.transitions || []).map((t) =>
				getReferenceFromResourceIdentifier<StateReference>(
					t,
					context.projectKey,
					this._storage,
				),
			),
		);

		const resource: State = {
			...getBaseResourceProperties(context.clientId),
			...draft,
			builtIn: false,
			initial: draft.initial || false,
			transitions,
		};

		return await this.saveNew(context, resource);
	}
}

class StateUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<State, StateUpdateAction>
{
	addRoles(
		context: RepositoryContext,
		resource: Writable<State>,
		action: StateAddRolesAction,
	) {
		if (!resource.roles) {
			resource.roles = [];
		}
		for (const role of action.roles) {
			if (!resource.roles.includes(role)) {
				resource.roles.push(role);
			}
		}
	}

	changeInitial(
		context: RepositoryContext,
		resource: Writable<State>,
		{ initial }: StateChangeInitialAction,
	) {
		resource.initial = initial;
	}

	changeKey(
		context: RepositoryContext,
		resource: Writable<State>,
		{ key }: StateChangeKeyAction,
	) {
		resource.key = key;
	}

	changeType(
		context: RepositoryContext,
		resource: Writable<State>,
		action: StateChangeTypeAction,
	) {
		resource.type = action.type;
	}

	removeRoles(
		context: RepositoryContext,
		resource: Writable<State>,
		action: StateRemoveRolesAction,
	) {
		resource.roles = resource.roles?.filter(
			(role) => !action.roles.includes(role),
		);
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<State>,
		{ description }: StateSetDescriptionAction,
	) {
		resource.description = description;
	}

	setName(
		context: RepositoryContext,
		resource: Writable<State>,
		{ name }: StateSetNameAction,
	) {
		resource.name = name;
	}

	setRoles(
		context: RepositoryContext,
		resource: Writable<State>,
		{ roles }: StateSetRolesAction,
	) {
		resource.roles = roles;
	}

	setTransitions(
		context: RepositoryContext,
		resource: Writable<State>,
		{ transitions }: StateSetTransitionsAction,
	) {
		resource.transitions = transitions?.map(
			(resourceId): StateReference => ({
				id: resourceId.id || "",
				typeId: "state",
			}),
		);
	}
}
