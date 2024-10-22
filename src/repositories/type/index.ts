import type { Type, TypeDraft } from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "~src/helpers";
import type { AbstractStorage } from "~src/storage/abstract";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { TypeUpdateHandler } from "./actions";

export class TypeRepository extends AbstractResourceRepository<"type"> {
	constructor(storage: AbstractStorage) {
		super("type", storage);
		this.actions = new TypeUpdateHandler(storage);
	}

	create(context: RepositoryContext, draft: TypeDraft): Type {
		const resource: Type = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			resourceTypeIds: draft.resourceTypeIds,
			fieldDefinitions: draft.fieldDefinitions || [],
			description: draft.description,
		};
		return this.saveNew(context, resource);
	}
}
