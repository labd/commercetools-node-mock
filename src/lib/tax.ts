import type {
	Cart,
	ExternalTaxAmountDraft,
	ExternalTaxRateDraft,
	RoundingMode,
	TaxCategory,
	TaxedItemPrice,
	TaxedPrice,
	TaxPortion,
	TaxRate,
} from "@commercetools/platform-sdk";
import { Decimal } from "decimal.js";
import {
	createCentPrecisionMoney,
	roundDecimal,
} from "#src/repositories/helpers.ts";

const roundCents = (value: number, mode: RoundingMode = "HalfEven"): number =>
	roundDecimal(new Decimal(value), mode).toNumber();

export const buildTaxedPriceFromExternalAmount = (
	draft: ExternalTaxAmountDraft,
	roundingMode: RoundingMode = "HalfEven",
): TaxedItemPrice => {
	const taxRate = taxRateFromExternalDraft(draft.taxRate);
	const totalGross = createCentPrecisionMoney(draft.totalGross);
	const currencyCode = totalGross.currencyCode;
	const toMoney = (centAmount: number) =>
		createCentPrecisionMoney({ currencyCode, centAmount });

	const grossAmount = totalGross.centAmount;
	// totalGross is authoritative in ExternalAmount mode, so net is always
	// gross / (1 + rate) regardless of taxRate.includedInPrice. The flag is kept
	// on the stored taxRate for callers that read it back.
	const taxAmount =
		taxRate.amount > 0
			? roundCents(
					new Decimal(grossAmount)
						.mul(taxRate.amount)
						.div(1 + taxRate.amount)
						.toNumber(),
					roundingMode,
				)
			: 0;
	const netAmount = grossAmount - taxAmount;

	return {
		totalNet: toMoney(netAmount),
		totalGross,
		totalTax: taxAmount > 0 ? toMoney(taxAmount) : undefined,
		taxPortions:
			taxAmount > 0
				? [
						{
							rate: taxRate.amount,
							name: taxRate.name,
							amount: toMoney(taxAmount),
						},
					]
				: [],
	};
};

export const taxRateFromExternalDraft = (
	draft: ExternalTaxRateDraft,
): TaxRate => {
	const amount =
		draft.amount ??
		draft.subRates?.reduce((acc, subRate) => acc + subRate.amount, 0) ??
		0;
	return {
		name: draft.name,
		amount,
		includedInPrice: draft.includedInPrice ?? false,
		country: draft.country,
		state: draft.state,
		subRates: draft.subRates,
	};
};

type TaxableResource = Pick<
	Cart,
	"lineItems" | "customLineItems" | "shippingInfo" | "totalPrice"
>;

export const calculateTaxTotals = (
	resource: TaxableResource,
): {
	taxedPrice?: TaxedPrice;
	taxedShippingPrice?: TaxedItemPrice;
} => {
	const taxedItemPrices: TaxedItemPrice[] = [];

	resource.lineItems.forEach((item) => {
		if (item.taxedPrice) {
			taxedItemPrices.push(item.taxedPrice);
		}
	});

	resource.customLineItems.forEach((item) => {
		if (item.taxedPrice) {
			taxedItemPrices.push(item.taxedPrice);
		}
	});

	let taxedShippingPrice: TaxedItemPrice | undefined;
	if (resource.shippingInfo?.taxedPrice) {
		taxedShippingPrice = resource.shippingInfo.taxedPrice;
		taxedItemPrices.push(resource.shippingInfo.taxedPrice);
	}

	if (!taxedItemPrices.length) {
		return {
			taxedPrice: undefined,
			taxedShippingPrice,
		};
	}

	const currencyCode = resource.totalPrice.currencyCode;
	const toMoney = (centAmount: number) =>
		createCentPrecisionMoney({
			currencyCode,
			centAmount,
		});

	let totalNet = 0;
	let totalGross = 0;
	let totalTax = 0;

	const taxPortionsByRate = new Map<
		string,
		{ rate: number; name?: string; centAmount: number }
	>();

	taxedItemPrices.forEach((price) => {
		totalNet += price.totalNet.centAmount;
		totalGross += price.totalGross.centAmount;
		const priceTax = price.totalTax
			? price.totalTax.centAmount
			: price.totalGross.centAmount - price.totalNet.centAmount;
		totalTax += Math.max(priceTax, 0);

		price.taxPortions?.forEach((portion) => {
			const key = `${portion.rate}-${portion.name ?? ""}`;
			const existing = taxPortionsByRate.get(key) ?? {
				rate: portion.rate,
				name: portion.name,
				centAmount: 0,
			};
			existing.centAmount += portion.amount.centAmount;
			taxPortionsByRate.set(key, existing);
		});
	});

	const taxPortions: TaxPortion[] = Array.from(taxPortionsByRate.values()).map(
		(portion) => ({
			rate: portion.rate,
			name: portion.name,
			amount: toMoney(portion.centAmount),
		}),
	);

	return {
		taxedPrice: {
			totalNet: toMoney(totalNet),
			totalGross: toMoney(totalGross),
			taxPortions,
			totalTax: totalTax > 0 ? toMoney(totalTax) : undefined,
		},
		taxedShippingPrice,
	};
};

export const calculateTaxedPriceFromRate = (
	amount: number,
	currencyCode: string,
	taxRate?: TaxRate,
	roundingMode: RoundingMode = "HalfEven",
): TaxedItemPrice | undefined => {
	if (!taxRate) {
		return undefined;
	}

	const toMoney = (centAmount: number) =>
		createCentPrecisionMoney({
			type: "centPrecision",
			currencyCode,
			centAmount,
		});

	let netAmount: number;
	let grossAmount: number;
	let taxAmount: number;

	if (taxRate.includedInPrice) {
		grossAmount = amount;
		taxAmount = roundCents(
			new Decimal(grossAmount)
				.mul(taxRate.amount)
				.div(1 + taxRate.amount)
				.toNumber(),
			roundingMode,
		);
		netAmount = grossAmount - taxAmount;
	} else {
		netAmount = amount;
		taxAmount = roundCents(
			new Decimal(netAmount).mul(taxRate.amount).toNumber(),
			roundingMode,
		);
		grossAmount = netAmount + taxAmount;
	}

	return {
		totalNet: toMoney(netAmount),
		totalGross: toMoney(grossAmount),
		totalTax: taxAmount > 0 ? toMoney(taxAmount) : undefined,
		taxPortions:
			taxAmount > 0
				? [
						{
							rate: taxRate.amount,
							name: taxRate.name,
							amount: toMoney(taxAmount),
						},
					]
				: [],
	};
};

export const calculateTaxedPrice = (
	amount: number,
	taxCategory: TaxCategory | undefined,
	currency: string,
	country: string | undefined,
	roundingMode: RoundingMode = "HalfEven",
): TaxedPrice | undefined => {
	if (!taxCategory?.rates.length) {
		return undefined;
	}

	const taxRate =
		taxCategory.rates.find(
			(rate) => !rate.country || rate.country === country,
		) || taxCategory.rates[0];

	const taxedItemPrice = calculateTaxedPriceFromRate(
		amount,
		currency,
		taxRate,
		roundingMode,
	);
	if (!taxedItemPrice) {
		return undefined;
	}

	return {
		totalNet: taxedItemPrice.totalNet,
		totalGross: taxedItemPrice.totalGross,
		taxPortions: taxedItemPrice.taxPortions,
		totalTax: taxedItemPrice.totalTax,
	};
};
