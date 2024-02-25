import { Cart, LineItem, Price } from "@commercetools/platform-sdk";

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
	lineItem.price!.value.centAmount * lineItem.quantity;

export const calculateCartTotalPrice = (cart: Cart): number =>
	cart.lineItems.reduce((cur, item) => cur + item.totalPrice.centAmount, 0);
