import type { Type, TypeDraft } from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { TypeUpdateHandler } from "./actions";

export class TypeRepository extends AbstractResourceRepository<"type"> {
	constructor(config: Config) {
		super("type", config);
		this.actions = new TypeUpdateHandler(config.storage);
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
