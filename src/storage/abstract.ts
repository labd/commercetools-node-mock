import type {
	BaseResource,
	CustomObject,
	InvalidInputError,
	InvalidJsonInputError,
	PagedQueryResponse,
	Product,
	Project,
	QueryParam,
	Reference,
	ReferencedResourceNotFoundError,
	ResourceIdentifier,
	ShoppingListLineItem,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import { parseExpandClause } from "../lib/expandParser.ts";
import { parseQueryExpression } from "../lib/predicateParser.ts";
import type {
	PagedQueryResponseMap,
	ResourceMap,
	ResourceType,
	Writable,
} from "../types.ts";
import type { StorageMap } from "./storage-map.ts";

export type GetParams = {
	expand?: string[];
};

export type QueryParams = {
	expand?: string | string[];
	sort?: string | string[];
	limit?: number;
	offset?: number;
	withTotal?: boolean;
	where?: string | string[];
	[key: string]: QueryParam;
};

export abstract class AbstractStorage {
	/**
	 * Close the storage backend and release any resources.
	 * Override this in subclasses that hold external resources (e.g. database connections).
	 */
	close(): void {}

	abstract clear(): Promise<void>;

	abstract all<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
	): Promise<Array<ResourceMap[RT]>>;

	/**
	 * Return the number of resources of the given type.
	 * This is more efficient than loading all resources and counting them.
	 */
	abstract count(projectKey: string, typeId: ResourceType): Promise<number>;

	abstract add<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		obj: ResourceMap[RT],
		params?: GetParams,
	): Promise<ResourceMap[RT]>;

	abstract get<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params?: GetParams,
	): Promise<ResourceMap[RT] | null>;

	abstract getByKey<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		key: string,
		params?: GetParams,
	): Promise<ResourceMap[RT] | null>;

	abstract addProject(projectKey: string): Promise<Project>;

	abstract getProject(projectKey: string): Promise<Project>;

	abstract saveProject(project: Project): Promise<Project>;

	abstract delete<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams,
	): Promise<ResourceMap[RT] | null>;

	abstract query<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		params: QueryParams,
	): Promise<PagedQueryResponseMap[RT]>;

	/**
	 * Look up a custom object by its container and key.
	 * This is an O(1) operation for storage backends that maintain
	 * a secondary index on (container, key).
	 */
	abstract getByContainerAndKey(
		projectKey: string,
		container: string,
		key: string,
	): Promise<CustomObject | null>;

	// Expand resolves a nested reference and injects the object in the given obj.
	// NOTE: This method mutates the passed object in-place. Callers must ensure
	// they pass an object that is safe to mutate (e.g. a clone from StorageMap
	// or JSON.parse).
	async expand<T>(
		projectKey: string,
		obj: T,
		clause: undefined | string | string[],
	): Promise<T> {
		if (!clause) return obj;
		if (Array.isArray(clause)) {
			for (const c of clause) {
				await this._resolveResource(projectKey, obj, c);
			}
		} else {
			await this._resolveResource(projectKey, obj, clause);
		}
		return obj;
	}

	async getByResourceIdentifier<RT extends ResourceType>(
		projectKey: string,
		identifier: ResourceIdentifier,
	): Promise<ResourceMap[RT]> {
		if (identifier.id) {
			const resource = await this.get(
				projectKey,
				identifier.typeId,
				identifier.id,
			);
			if (resource) {
				return resource as ResourceMap[RT];
			}

			throw new CommercetoolsError<ReferencedResourceNotFoundError>({
				code: "ReferencedResourceNotFound",
				message: `The referenced object of type '${identifier.typeId}' with id '${identifier.id}' was not found. It either doesn't exist, or it can't be accessed from this endpoint (e.g., if the endpoint filters by store or customer account).`,
				typeId: identifier.typeId,
				id: identifier.id,
			});
		}

		if (identifier.key) {
			const resource = await this.getByKey(
				projectKey,
				identifier.typeId,
				identifier.key,
			);
			if (resource) {
				return resource as ResourceMap[RT];
			}

			throw new CommercetoolsError<ReferencedResourceNotFoundError>({
				code: "ReferencedResourceNotFound",
				message: `The referenced object of type '${identifier.typeId}' with key '${identifier.key}' was not found. It either doesn't exist, or it can't be accessed from this endpoint (e.g., if the endpoint filters by store or customer account).`,
				typeId: identifier.typeId,
				key: identifier.key,
			});
		}
		throw new CommercetoolsError<InvalidJsonInputError>({
			code: "InvalidJsonInput",
			message: "Request body does not contain valid JSON.",
			detailedErrorMessage: "ResourceIdentifier requires an 'id' xor a 'key'",
		});
	}

	async search(
		projectKey: string,
		typeId: ResourceType,
		params: QueryParams,
	): Promise<PagedQueryResponse> {
		let resources = await this.all(projectKey, typeId);

		// Apply predicates
		if (params.where) {
			try {
				const filterFunc = parseQueryExpression(params.where);
				resources = resources.filter((resource) => filterFunc(resource, {}));
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: (err as any).message,
					},
					400,
				);
			}
		}

		// Get the total before slicing the array
		const totalResources = resources.length;

		// Apply offset, limit
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		resources = resources.slice(offset, offset + limit);

		// Expand the resources
		if (params.expand !== undefined) {
			resources = await Promise.all(
				resources.map((resource) =>
					this.expand(projectKey, resource, params.expand),
				),
			);
		}

		return {
			count: resources.length,
			total: totalResources,
			offset: offset,
			limit: limit,
			results: resources,
		};
	}

	private async _resolveResource(projectKey: string, obj: any, expand: string) {
		const params = parseExpandClause(expand);

		// 'lineItems[*].variant' on ShoppingList is an exception, these variants are not references
		if (params.index === "*") {
			const reference = obj[params.element];
			if (
				params.element === "lineItems" &&
				params.rest?.startsWith("variant") &&
				reference.every(
					(item: any) =>
						item.variant === undefined && item.variantId !== undefined,
				)
			) {
				for (const item of reference as ShoppingListLineItem[]) {
					await this._resolveShoppingListLineItemVariant(projectKey, item);
				}
			}
		}

		if (!params.index) {
			const reference = obj[params.element];
			if (reference === undefined) {
				return;
			}
			await this._resolveReference(projectKey, reference, params.rest);
		} else if (params.index === "*") {
			const reference = obj[params.element];
			if (reference === undefined || !Array.isArray(reference)) return;
			for (const itemRef of reference as Writable<Reference>[]) {
				await this._resolveReference(projectKey, itemRef, params.rest);
			}
		} else {
			const reference = obj[params.element][params.index];
			if (reference === undefined) return;
			await this._resolveReference(projectKey, reference, params.rest);
		}
	}

	private async _resolveReference(
		projectKey: string,
		reference: any,
		expand: string | undefined,
	) {
		if (reference === undefined) return;

		if (
			reference.typeId !== undefined &&
			(reference.id !== undefined || reference.key !== undefined)
		) {
			// First check if the object is already resolved. This is the case when
			// the complete resource is pushed via the .add() method.
			if (!reference.obj) {
				reference.obj = await this.getByResourceIdentifier(projectKey, {
					typeId: reference.typeId,
					id: reference.id,
					key: reference.key,
				} as ResourceIdentifier);
			}
			if (expand) {
				await this._resolveResource(projectKey, reference.obj, expand);
			}
		} else {
			if (expand) {
				await this._resolveResource(projectKey, reference, expand);
			}
		}
	}

	private async _resolveShoppingListLineItemVariant(
		projectKey: string,
		lineItem: ShoppingListLineItem,
	) {
		const product = (await this.getByResourceIdentifier(projectKey, {
			typeId: "product",
			id: lineItem.productId,
		})) as Product | undefined;

		if (!product) {
			return;
		}

		const variant = [
			product.masterData.current.masterVariant,
			...product.masterData.current.variants,
		].find((e) => e.id === lineItem.variantId);
		// @ts-expect-error
		lineItem.variant = variant;
	}
}

export type ProjectStorage = {
	[index in ResourceType]: StorageMap<string, BaseResource>;
};
