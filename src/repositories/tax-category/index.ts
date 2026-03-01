import type {
	TaxCategory,
	TaxCategoryDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { TaxCategoryDraftSchema } from "#src/schemas/generated/tax-category.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import { TaxCategoryUpdateHandler } from "./actions.ts";
import { taxRateFromTaxRateDraft } from "./helpers.ts";

export class TaxCategoryRepository extends AbstractResourceRepository<"tax-category"> {
	constructor(config: Config) {
		super("tax-category", config);
		this.actions = new TaxCategoryUpdateHandler(this._storage);
		this.draftSchema = TaxCategoryDraftSchema;
	}

	create(context: RepositoryContext, draft: TaxCategoryDraft): TaxCategory {
		const resource: TaxCategory = {
			...getBaseResourceProperties(),
			...draft,
			rates: draft.rates?.map(taxRateFromTaxRateDraft) || [],
		};
		return this.saveNew(context, resource);
	}
}
