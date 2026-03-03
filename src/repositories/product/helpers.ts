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
import type { AbstractStorage } from "#src/storage/index.ts";
import type { Writable } from "#src/types.ts";
import type { RepositoryContext } from "../abstract.ts";
import {
	createCustomFields,
	createTypedMoney,
	getReferenceFromResourceIdentifier,
} from "../helpers.ts";

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

export const variantFromDraft = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	variantId: number,
	variant: ProductVariantDraft,
): Promise<ProductVariant> => {
	const prices = variant?.prices
		? await Promise.all(
				variant.prices.map((p) => priceFromDraft(context, storage, p)),
			)
		: undefined;
	const assets = variant.assets
		? await Promise.all(
				variant.assets.map((a) => assetFromDraft(context, storage, a)),
			)
		: [];

	return {
		id: variantId,
		sku: variant?.sku,
		key: variant?.key,
		attributes: variant?.attributes ?? [],
		prices,
		assets,
		images: variant.images ?? [],
	};
};

export const assetFromDraft = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: AssetDraft,
): Promise<Asset> => {
	const asset: Asset = {
		...draft,
		id: uuidv4(),
		custom: await createCustomFields(draft.custom, context.projectKey, storage),
	};
	return asset;
};

export const priceFromDraft = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	draft: PriceDraft,
): Promise<Price> => ({
	id: uuidv4(),
	key: draft.key,
	country: draft.country,
	value: createTypedMoney(draft.value),
	channel: draft.channel
		? await getReferenceFromResourceIdentifier<ChannelReference>(
				draft.channel,
				context.projectKey,
				storage,
			)
		: undefined,
});
