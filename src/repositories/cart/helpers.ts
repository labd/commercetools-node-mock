import type {
	Cart,
	CentPrecisionMoney,
	CustomLineItem,
	CustomLineItemDraft,
	LineItem,
	Price,
	TaxCategory,
	TaxCategoryReference,
	TaxedPrice,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { AbstractStorage } from "~src/storage/abstract";
import {
	createCentPrecisionMoney,
	createCustomFields,
	createTypedMoney,
	getReferenceFromResourceIdentifier,
} from "../helpers";

export const selectPrice = ({
	prices,
	currency,
	country,
}: {
	prices: Price[] | undefined;
	currency: string;
	country: string | undefined;
}): Price | undefined => {
	if (!prices) {
		return undefined;
	}

	// Quick-and-dirty way of selecting price based on the given currency and country.
	// Can be improved later to give more priority to exact matches over
	// 'all country' matches, and include customer groups in the mix as well
	return prices.find((price) => {
		const countryMatch = !price.country || price.country === country;
		const currencyMatch = price.value.currencyCode === currency;
		return countryMatch && currencyMatch;
	});
};

export const calculateLineItemTotalPrice = (lineItem: LineItem): number =>
	lineItem.price?.value.centAmount * lineItem.quantity;

export const calculateCartTotalPrice = (cart: Cart): number => {
	const lineItemsTotal = cart.lineItems.reduce(
		(cur, item) => cur + item.totalPrice.centAmount,
		0,
	);
	const customLineItemsTotal = cart.customLineItems.reduce(
		(cur, item) => cur + item.totalPrice.centAmount,
		0,
	);
	return lineItemsTotal + customLineItemsTotal;
};

export const calculateTaxedPrice = (
	amount: number,
	taxCategory: TaxCategory | undefined,
	currency: string,
	country: string | undefined,
): TaxedPrice | undefined => {
	if (!taxCategory || !taxCategory.rates.length) {
		return undefined;
	}

	// Find the appropriate tax rate for the country
	const taxRate =
		taxCategory.rates.find(
			(rate) => !rate.country || rate.country === country,
		) || taxCategory.rates[0]; // Fallback to first rate if no country-specific rate found

	if (!taxRate) {
		return undefined;
	}

	let netAmount: number;
	let grossAmount: number;
	let taxAmount: number;

	if (taxRate.includedInPrice) {
		// Amount is gross, calculate net
		grossAmount = amount;
		taxAmount = Math.round(
			(grossAmount * taxRate.amount) / (1 + taxRate.amount),
		);
		netAmount = grossAmount - taxAmount;
	} else {
		// Amount is net, calculate gross
		netAmount = amount;
		taxAmount = Math.round(netAmount * taxRate.amount);
		grossAmount = netAmount + taxAmount;
	}

	return {
		totalNet: {
			type: "centPrecision",
			currencyCode: currency,
			centAmount: netAmount,
			fractionDigits: 2,
		},
		totalGross: {
			type: "centPrecision",
			currencyCode: currency,
			centAmount: grossAmount,
			fractionDigits: 2,
		},
		taxPortions:
			taxAmount > 0
				? [
						{
							rate: taxRate.amount,
							amount: {
								type: "centPrecision",
								currencyCode: currency,
								centAmount: taxAmount,
								fractionDigits: 2,
							},
							name: taxRate.name,
						},
					]
				: [],
		totalTax:
			taxAmount > 0
				? {
						type: "centPrecision",
						currencyCode: currency,
						centAmount: taxAmount,
						fractionDigits: 2,
					}
				: undefined,
	};
};

export const createCustomLineItemFromDraft = (
	projectKey: string,
	draft: CustomLineItemDraft,
	storage: AbstractStorage,
	country?: string,
): CustomLineItem => {
	const quantity = draft.quantity ?? 1;

	const taxCategoryRef = draft.taxCategory
		? getReferenceFromResourceIdentifier<TaxCategoryReference>(
				draft.taxCategory,
				projectKey,
				storage,
			)
		: undefined;

	// Get the tax category to calculate taxed price
	let taxCategory: TaxCategory | undefined = undefined;
	if (taxCategoryRef) {
		try {
			taxCategory =
				storage.get(projectKey, "tax-category", taxCategoryRef.id, {}) ||
				undefined;
		} catch (error) {
			// Tax category not found, continue without tax calculation
		}
	}

	const totalPrice = createCentPrecisionMoney({
		...draft.money,
		centAmount: (draft.money.centAmount ?? 0) * quantity,
	});

	// Calculate taxed price if tax category is available
	const taxedPrice = taxCategory
		? calculateTaxedPrice(
				totalPrice.centAmount,
				taxCategory,
				totalPrice.currencyCode,
				country,
			)
		: undefined;

	return {
		id: uuidv4(),
		name: draft.name,
		money: createTypedMoney(draft.money),
		slug: draft.slug,
		quantity: draft.quantity ?? 1,
		state: [],
		taxCategory: taxCategoryRef,
		taxedPrice,
		custom: createCustomFields(draft.custom, projectKey, storage),
		discountedPricePerQuantity: [],
		perMethodTaxRate: [],
		priceMode: draft.priceMode ?? "Standard",
		totalPrice,
		taxedPricePortions: [],
	};
};
