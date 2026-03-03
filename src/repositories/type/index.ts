import type { Type, TypeDraft } from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { TypeDraftSchema } from "#src/schemas/generated/type.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { TypeUpdateHandler } from "./actions.ts";

export class TypeRepository extends AbstractResourceRepository<"type"> {
	constructor(config: Config) {
		super("type", config);
		this.actions = new TypeUpdateHandler(config.storage);
		this.draftSchema = TypeDraftSchema;
	}

	async create(context: RepositoryContext, draft: TypeDraft): Promise<Type> {
		const resource: Type = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			resourceTypeIds: draft.resourceTypeIds,
			fieldDefinitions: draft.fieldDefinitions || [],
			description: draft.description,
		};
		return await this.saveNew(context, resource);
	}
}
