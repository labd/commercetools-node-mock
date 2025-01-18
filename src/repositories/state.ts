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
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract";
import { AbstractResourceRepository, AbstractUpdateHandler } from "./abstract";
import { getReferenceFromResourceIdentifier } from "./helpers";

export class StateRepository extends AbstractResourceRepository<"state"> {
	constructor(config: Config) {
		super("state", config);
		this.actions = new StateUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: StateDraft): State {
		const resource: State = {
			...getBaseResourceProperties(),
			...draft,
			builtIn: false,
			initial: draft.initial || false,
			transitions: (draft.transitions || []).map((t) =>
				getReferenceFromResourceIdentifier(
					t,
					context.projectKey,
					this._storage,
				),
			),
		};

		return this.saveNew(context, resource);
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
