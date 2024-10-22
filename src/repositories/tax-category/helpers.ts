import type { TaxRate, TaxRateDraft } from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";

export const taxRateFromTaxRateDraft = (draft: TaxRateDraft): TaxRate => ({
	...draft,
	id: uuidv4(),
	amount: draft.amount || 0,
});
