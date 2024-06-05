import type {
	CustomObject,
	CustomObjectDraft,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { AbstractStorage } from "~src/storage";
import { cloneObject, getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	QueryParams,
	type RepositoryContext,
} from "./abstract";
import { checkConcurrentModification } from "./errors";

export class CustomObjectRepository extends AbstractResourceRepository<"key-value-document"> {
	constructor(storage: AbstractStorage) {
		super("key-value-document", storage);
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
		} else {
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

		// @ts-ignore
		result.results = result.results.map((r) =>
			this.postProcessResource(context, r as CustomObject, {
				expand: params.expand,
			}),
		);
		return result;
	}
}
