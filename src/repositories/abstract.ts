import { isDeepStrictEqual } from "node:util";
import type {
	BaseResource,
	CustomFields,
	FieldContainer,
	InvalidInputError,
	InvalidOperationError,
	Project,
	QueryParam,
	ResourceNotFoundError,
	TypeResourceIdentifier,
	UpdateAction,
} from "@commercetools/platform-sdk";
import type { z } from "zod";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { cloneObject } from "../helpers.ts";
import type { AbstractStorage } from "../storage/index.ts";
import type {
	ResourceMap,
	ResourceType,
	ShallowWritable,
	Writable,
} from "./../types.ts";
import { checkConcurrentModification } from "./errors.ts";
import { createCustomFields } from "./helpers.ts";

export type QueryParams = {
	expand?: string[];
	where?: string[];
	offset?: number;
	limit?: number;

	// Predicate var values. Should always start with `var.`
	[key: string]: QueryParam;
};

export type GetParams = {
	expand?: string[];
};

export type RepositoryContext = {
	projectKey: string;
	storeKey?: string;
	clientId?: string;
};

export abstract class AbstractRepository<R extends BaseResource | Project> {
	protected _storage: AbstractStorage;

	protected config: Config;

	protected actions: AbstractUpdateHandler | undefined;

	constructor(config: Config) {
		this.config = config;
		this._storage = config.storage;
	}

	async saveNew({ projectKey }: RepositoryContext, resource: R): Promise<R> {
		throw new Error("Not implemented");
	}

	async saveUpdate(
		{ projectKey }: RepositoryContext,
		version: number,
		resource: R,
	): Promise<R> {
		throw new Error("Not implemented");
	}

	async postProcessResource(
		context: RepositoryContext,
		resource: any,
	): Promise<any> {
		throw new Error("Not implemented");
	}

	async processUpdateActions(
		context: RepositoryContext,
		resource: R,
		version: number,
		actions: UpdateAction[],
	): Promise<R> {
		if (!this.actions) {
			throw new Error("No actions defined");
		}

		const updatedResource = await this.actions.apply(
			context,
			resource,
			version,
			actions,
		);

		// If all actions succeeded we write the new version
		// to the storage.
		if (resource.version !== updatedResource.version) {
			await this.saveUpdate(context, version, updatedResource);
		}

		const result = await this.postProcessResource(context, updatedResource);
		if (!result) {
			throw new Error("invalid post process action");
		}
		return result;
	}
}

export abstract class AbstractResourceRepository<
	T extends ResourceType,
> extends AbstractRepository<ResourceMap[T]> {
	protected _typeId: T;

	/**
	 * Optional Zod schema for validating creation drafts.
	 * When set and strict mode is enabled, the service layer will
	 * validate incoming request bodies against this schema before
	 * passing them to create().
	 */
	draftSchema?: z.ZodType;

	constructor(typeId: T, config: Config) {
		super(config);
		this._typeId = typeId;
	}

	/**
	 * Whether strict validation is enabled.
	 */
	get strict(): boolean {
		return this.config.strict;
	}

	abstract create(
		context: RepositoryContext,
		draft: any,
	): Promise<ResourceMap[T]>;

	protected getTypeId(): T {
		return this._typeId;
	}

	/**
	 * Apply expand clauses to a resource without re-fetching from storage.
	 */
	async expand(
		context: RepositoryContext,
		resource: ResourceMap[T],
		expand: string[] | undefined,
	): Promise<ResourceMap[T]> {
		if (!expand || expand.length === 0) {
			return resource;
		}
		return this._storage.expand(context.projectKey, resource, expand);
	}

	async delete(
		context: RepositoryContext,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[T] | null> {
		const resource = await this._storage.delete(
			context.projectKey,
			this.getTypeId(),
			id,
			params,
		);
		return resource
			? await this.postProcessResource(context, resource, params)
			: null;
	}

	async get(
		context: RepositoryContext,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[T] | null> {
		const resource = await this._storage.get(
			context.projectKey,
			this.getTypeId(),
			id,
			params,
		);
		return resource
			? await this.postProcessResource(context, resource, params)
			: null;
	}

	async getByKey(
		context: RepositoryContext,
		key: string,
		params: GetParams = {},
	): Promise<ResourceMap[T] | null> {
		const resource = await this._storage.getByKey(
			context.projectKey,
			this.getTypeId(),
			key,
			params,
		);
		return resource
			? await this.postProcessResource(context, resource, params)
			: null;
	}

	async postProcessResource(
		context: RepositoryContext,
		resource: ResourceMap[T],
		params?: GetParams,
	): Promise<ResourceMap[T]> {
		return resource;
	}

	async query(context: RepositoryContext, params: QueryParams = {}) {
		const result = await this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{
				...params,
			},
		);

		const data = await Promise.all(
			result.results.map((r) =>
				this.postProcessResource(context, r as ResourceMap[T], {
					expand: params.expand,
				}),
			),
		);
		return {
			...result,
			results: data,
		};
	}

	async saveNew(
		context: RepositoryContext,
		resource: ShallowWritable<ResourceMap[T]>,
	): Promise<ResourceMap[T]> {
		resource.version = 1;
		return await this._storage.add(
			context.projectKey,
			this.getTypeId(),
			resource as any,
		);
	}

	async saveUpdate(
		context: RepositoryContext,
		version: number,
		resource: ShallowWritable<ResourceMap[T]>,
	): Promise<ResourceMap[T]> {
		// Check if the resource still exists.
		const current = await this._storage.get(
			context.projectKey,
			this.getTypeId(),
			resource.id,
		);
		if (!current) {
			throw new CommercetoolsError<ResourceNotFoundError>(
				{
					code: "ResourceNotFound",
					message: "Resource not found while updating",
				},
				400,
			);
		}

		checkConcurrentModification(current.version, version, resource.id);

		if (current.version === resource.version) {
			throw new Error("Internal error: no changes to save");
		}
		resource.lastModifiedAt = new Date().toISOString();
		(resource as any).lastModifiedBy = {
			clientId: context.clientId ?? "",
			isPlatformClient: false,
		};

		await this._storage.add(
			context.projectKey,
			this.getTypeId(),
			resource as any,
		);

		return resource as ResourceMap[T];
	}
}

type UpdateActionHandlerMethod<A, T> = (
	context: RepositoryContext,
	resource: Writable<A>,
	action: T,
) => void | Promise<void>;

export type UpdateHandlerInterface<
	A extends BaseResource | Project,
	T extends UpdateAction,
> = {
	[P in T as P["action"]]: UpdateActionHandlerMethod<A, P>;
};

export class AbstractUpdateHandler {
	_storage: AbstractStorage;
	constructor(_storage: AbstractStorage) {
		if (!_storage) {
			throw new Error("No storage provided");
		}
		this._storage = _storage;
	}

	/**
	 * Shared implementation for setCustomField update actions.
	 *
	 * Throws InvalidOperation if the resource has no custom type set.
	 * When `value` is `null`, the field is removed; otherwise it is set.
	 */
	protected _setCustomFieldValues(
		resource: { custom?: CustomFields },
		{ name, value }: { name: string; value?: unknown },
	): void {
		if (!resource.custom) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Resource has no custom type",
				},
				400,
			);
		}
		if (value === null) {
			if (!(name in resource.custom.fields)) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message: `Cannot remove custom field ${name} because it does not exist.`,
					},
					400,
				);
			}
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
	}

	/**
	 * Shared implementation for setCustomType update actions.
	 *
	 * When `type` is provided, resolves the type reference and sets the
	 * custom fields on the resource. When `type` is not provided, removes
	 * the custom fields entirely.
	 */
	protected async _setCustomType(
		context: RepositoryContext,
		resource: { custom?: CustomFields },
		{
			type,
			fields,
		}: { type?: TypeResourceIdentifier; fields?: FieldContainer },
	): Promise<void> {
		if (type) {
			resource.custom = await createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
	}

	async apply<R extends BaseResource | Project>(
		context: RepositoryContext,
		resource: R,
		version: number,
		actions: UpdateAction[],
	): Promise<R> {
		// We need a separate working copy because the caller (processUpdateActions)
		// compares resource.version with updatedResource.version to detect changes.
		// The resource parameter is already a clone from storage, but we still need
		// two distinct references.
		const updatedResource = cloneObject(resource) as ShallowWritable<R>;
		const identifier = (resource as BaseResource).id
			? (resource as BaseResource).id
			: (resource as Project).key;

		for (const action of actions) {
			// Validate if this action exists
			// @ts-expect-error
			if (this[action.action] === undefined) {
				throw new CommercetoolsError<InvalidInputError>({
					code: "InvalidInput",
					message: `Invalid action ${action.action}`,
					errors: [
						{
							code: "InvalidInput",
							message: `Invalid action ${action.action}`,
						},
					],
				});
			}

			// @ts-expect-error
			const updateFunc = this[action.action].bind(this);

			if (!updateFunc) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: `No mock implemented for update action ${action.action}`,
					},
					400,
				);
			}

			// Snapshot the current state before applying the action so we can
			// detect whether it actually changed anything.
			const beforeUpdate = cloneObject(updatedResource);
			await updateFunc(context, updatedResource, action);

			// Check if the object is updated. We need to increase the version of
			// an object per action which does an actual modification.
			// This isn't the most performant method to do this (the update action
			// should return a flag) but for now the easiest.
			if (!isDeepStrictEqual(beforeUpdate, updatedResource)) {
				// We only check the version when there is an actual modification to
				// be stored.
				checkConcurrentModification(resource.version, version, identifier);

				updatedResource.version += 1;
			}
		}
		return updatedResource;
	}
}
