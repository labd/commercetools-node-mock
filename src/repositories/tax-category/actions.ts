import type {
	TaxCategory,
	TaxCategoryAddTaxRateAction,
	TaxCategoryChangeNameAction,
	TaxCategoryRemoveTaxRateAction,
	TaxCategoryReplaceTaxRateAction,
	TaxCategorySetDescriptionAction,
	TaxCategorySetKeyAction,
	TaxCategoryUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "~src/types";
import type { RepositoryContext } from "../abstract";
import { AbstractUpdateHandler } from "../abstract";
import { taxRateFromTaxRateDraft } from "./helpers";

type TaxCategoryUpdateHandlerMethod<T> = (
	context: RepositoryContext,
	resource: Writable<TaxCategory>,
	action: T,
) => void;

type TaxCategoryUpdateActions = {
	[P in TaxCategoryUpdateAction as P["action"]]: TaxCategoryUpdateHandlerMethod<P>;
};

export class TaxCategoryUpdateHandler
	extends AbstractUpdateHandler
	implements TaxCategoryUpdateActions
{
	addTaxRate(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ taxRate }: TaxCategoryAddTaxRateAction,
	) {
		if (resource.rates === undefined) {
			resource.rates = [];
		}
		resource.rates.push(taxRateFromTaxRateDraft(taxRate));
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ name }: TaxCategoryChangeNameAction,
	) {
		resource.name = name;
	}

	removeTaxRate(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ taxRateId }: TaxCategoryRemoveTaxRateAction,
	) {
		if (resource.rates === undefined) {
			resource.rates = [];
		}
		resource.rates = resource.rates.filter(
			(taxRate) => taxRate.id !== taxRateId,
		);
	}

	replaceTaxRate(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ taxRateId, taxRate }: TaxCategoryReplaceTaxRateAction,
	) {
		if (resource.rates === undefined) {
			resource.rates = [];
		}

		const taxRateObj = taxRateFromTaxRateDraft(taxRate);
		for (let i = 0; i < resource.rates.length; i++) {
			const rate = resource.rates[i];
			if (rate.id === taxRateId) {
				resource.rates[i] = taxRateObj;
			}
		}
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ description }: TaxCategorySetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<TaxCategory>,
		{ key }: TaxCategorySetKeyAction,
	) {
		resource.key = key;
	}
}
