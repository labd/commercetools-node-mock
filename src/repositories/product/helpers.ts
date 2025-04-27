import { isDeepStrictEqual } from "node:util";
import type {
	Asset,
	AssetDraft,
	ChannelReference,
	Price,
	PriceDraft,
	Product,
	ProductData,
	ProductVariant,
	ProductVariantDraft,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { AbstractStorage } from "~src/storage";
import type { Writable } from "~src/types";
import type { RepositoryContext } from "../abstract";
import {
	createCustomFields,
	createTypedMoney,
	getReferenceFromResourceIdentifier,
} from "../helpers";

interface VariantResult {
	variant: Writable<ProductVariant> | undefined;
	isMasterVariant: boolean;
	variantIndex: number;
}

export const getVariant = (
	productData: ProductData,
	variantId?: number,
	sku?: string,
): VariantResult => {
	const variants = [productData.masterVariant, ...productData.variants];
	const foundVariant = variants.find((variant: ProductVariant) => {
		if (variantId) {
			return variant.id === variantId;
		}
		if (sku) {
			return variant.sku === sku;
		}
		return false;
	});

	const isMasterVariant = foundVariant === productData.masterVariant;
	return {
		variant: foundVariant,
		isMasterVariant,
		variantIndex:
			!isMasterVariant && foundVariant
				? productData.variants.indexOf(foundVariant)
				: -1,
	};
};

// Check if the product still has staged data that is different from the
// current data.
export const checkForStagedChanges = (product: Writable<Product>) => {
	if (!product.masterData.staged) {
		product.masterData.staged = product.masterData.current;
	}

	if (
		isDeepStrictEqual(product.masterData.current, product.masterData.staged)
	) {
		product.masterData.hasStagedChanges = false;
	} else {
		product.masterData.hasStagedChanges = true;
	}
};

export const variantFromDraft = (
	context: RepositoryContext,
	storage: AbstractStorage,
	variantId: number,
	variant: ProductVariantDraft,
): ProductVariant => ({
	id: variantId,
	sku: variant?.sku,
	key: variant?.key,
	attributes: variant?.attributes ?? [],
	prices: variant?.prices?.map((p) => priceFromDraft(context, storage, p)),
	assets: variant.assets?.map((a) => assetFromDraft(context, storage, a)) ?? [],
	images: variant.images ?? [],
});

export const assetFromDraft = (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: AssetDraft,
): Asset => {
	const asset: Asset = {
		...draft,
		id: uuidv4(),
		custom: createCustomFields(draft.custom, context.projectKey, storage),
	};
	return asset;
};

export const priceFromDraft = (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: PriceDraft,
): Price => ({
	id: uuidv4(),
	key: draft.key,
	country: draft.country,
	value: createTypedMoney(draft.value),
	channel: draft.channel
		? getReferenceFromResourceIdentifier<ChannelReference>(
				draft.channel,
				context.projectKey,
				storage,
			)
		: undefined,
});
