import type {
	TaxCategory,
	TaxCategoryDraft,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "~src/helpers";
import { AbstractStorage } from "~src/storage/abstract";
import { AbstractResourceRepository, RepositoryContext } from "../abstract";
import { TaxCategoryUpdateHandler } from "./actions";
import { taxRateFromTaxRateDraft } from "./helpers";

export class TaxCategoryRepository extends AbstractResourceRepository<"tax-category"> {
	constructor(storage: AbstractStorage) {
		super("tax-category", storage);
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
