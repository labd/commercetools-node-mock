import type {
	CustomObject,
	CustomObjectDraft,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { CustomObjectDraftSchema } from "#src/schemas/generated/custom-object.ts";
import { getBaseResourceProperties } from "../helpers.ts";
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
		this.draftSchema = CustomObjectDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: Writable<CustomObjectDraft>,
	): Promise<CustomObject> {
		const current = (await this.getWithContainerAndKey(
			context,
			draft.container,
			draft.key,
		)) as Writable<CustomObject | undefined>;

		if (current) {
			// Only check version if it is passed in the draft
			if (draft.version) {
				checkConcurrentModification(current.version, draft.version, current.id);
			} else {
				draft.version = current.version;
			}

			if (draft.value !== current.value) {
				// current is already a clone from storage retrieval, safe to mutate
				current.value = draft.value;
				current.version += 1;
				await this.saveUpdate(context, draft.version, current);
				return current;
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
		const baseProperties = getBaseResourceProperties(context.clientId);
		const resource: CustomObject = {
			...baseProperties,
			container: draft.container,
			key: draft.key,
			value: draft.value,
		};

		await this.saveNew(context, resource);
		return resource;
	}

	async getWithContainerAndKey(
		context: RepositoryContext,
		container: string,
		key: string,
	) {
		return this._storage.getByContainerAndKey(
			context.projectKey,
			container,
			key,
		);
	}

	async queryWithContainer(
		context: RepositoryContext,
		container: string,
		params: QueryParams = {},
	) {
		const whereClause = params.where || [];
		whereClause.push(`container="${container}"`);
		const result = await this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{
				...params,
				where: whereClause,
			},
		);

		// @ts-expect-error
		result.results = await Promise.all(
			result.results.map((r) =>
				this.postProcessResource(context, r as CustomObject, {
					expand: params.expand,
				}),
			),
		);
		return result;
	}
}
