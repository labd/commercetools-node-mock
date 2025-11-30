import type {
	CustomObject,
	CustomObjectDraft,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { cloneObject, getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { QueryParams } from "./abstract.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "./abstract.ts";
import { checkConcurrentModification } from "./errors.ts";

export class CustomObjectRepository extends AbstractResourceRepository<"key-value-document"> {
	constructor(config: Config) {
		super("key-value-document", config);
	}

	create(
		context: RepositoryContext,
		draft: Writable<CustomObjectDraft>,
	): CustomObject {
		const current = this.getWithContainerAndKey(
			context,
			draft.container,
			draft.key,
		) as Writable<CustomObject | undefined>;

		if (current) {
			// Only check version if it is passed in the draft
			if (draft.version) {
				checkConcurrentModification(current.version, draft.version, current.id);
			} else {
				draft.version = current.version;
			}

			if (draft.value !== current.value) {
				const updated = cloneObject(current) as Writable<CustomObject>;
				updated.value = draft.value;
				updated.version += 1;
				this.saveUpdate(context, draft.version, updated);
				return updated;
			}
			return current;
		}
		// If the resource is new the only valid version is 0
		if (draft.version) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "version on create must be 0",
				},
				400,
			);
		}
		const baseProperties = getBaseResourceProperties();
		const resource: CustomObject = {
			...baseProperties,
			container: draft.container,
			key: draft.key,
			value: draft.value,
		};

		this.saveNew(context, resource);
		return resource;
	}

	getWithContainerAndKey(
		context: RepositoryContext,
		container: string,
		key: string,
	) {
		const items = this._storage.all(context.projectKey, this.getTypeId());
		return items.find(
			(item) => item.container === container && item.key === key,
		);
	}

	queryWithContainer(
		context: RepositoryContext,
		container: string,
		params: QueryParams = {},
	) {
		const whereClause = params.where || [];
		whereClause.push(`container="${container}"`);
		const result = this._storage.query(context.projectKey, this.getTypeId(), {
			...params,
			where: whereClause,
		});

		// @ts-expect-error
		result.results = result.results.map((r) =>
			this.postProcessResource(context, r as CustomObject, {
				expand: params.expand,
			}),
		);
		return result;
	}
}
