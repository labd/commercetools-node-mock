import type {
	Cart,
	CustomLineItem,
	CustomLineItemDraft,
	LineItem,
	Price,
	TaxCategory,
	TaxCategoryReference,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { calculateTaxedPrice } from "~src/lib/tax";
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

	const taxedPrice = taxCategory
		? calculateTaxedPrice(
				totalPrice.centAmount,
				taxCategory,
				totalPrice.currencyCode,
				country,
			)
		: undefined;

	const taxRate = taxCategory
		? taxCategory.rates.find(
				(rate) => !rate.country || rate.country === country,
			)
		: undefined;

	return {
		id: uuidv4(),
		key: draft.key,
		name: draft.name,
		money: createTypedMoney(draft.money),
		slug: draft.slug,
		quantity: draft.quantity ?? 1,
		state: [],
		taxCategory: taxCategoryRef,
		taxRate,
		taxedPrice,
		custom: createCustomFields(draft.custom, projectKey, storage),
		discountedPricePerQuantity: [],
		perMethodTaxRate: [],
		priceMode: draft.priceMode ?? "Standard",
		totalPrice,
		taxedPricePortions: [],
	};
};
