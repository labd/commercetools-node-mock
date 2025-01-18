import type {
	TaxCategory,
	TaxCategoryDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import { TaxCategoryUpdateHandler } from "./actions";
import { taxRateFromTaxRateDraft } from "./helpers";

export class TaxCategoryRepository extends AbstractResourceRepository<"tax-category"> {
	constructor(config: Config) {
		super("tax-category", config);
		this.actions = new TaxCategoryUpdateHandler(this._storage);
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
