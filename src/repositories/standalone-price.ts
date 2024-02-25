import type {
	ChannelReference,
	ChannelResourceIdentifier,
	DiscountedPriceDraft,
	StandalonePrice,
	StandalonePriceChangeActiveAction,
	StandalonePriceChangeValueAction,
	StandalonePriceDraft,
	StandalonePriceSetDiscountedPriceAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";
import { createTypedMoney } from "./helpers";

export class StandAlonePriceRepository extends AbstractResourceRepository<"standalone-price"> {
	getTypeId() {
		return "standalone-price" as const;
	}

	create(
		context: RepositoryContext,
		draft: StandalonePriceDraft,
	): StandalonePrice {
		const resource: StandalonePrice = {
			...getBaseResourceProperties(),
			active: draft.active ? draft.active : false,
			sku: draft.sku,
			value: createTypedMoney(draft.value),
			country: draft.country,
			discounted: draft.discounted
				? this.transformDiscountDraft(draft.discounted)
				: undefined,
			channel: draft.channel?.id
				? this.transformChannelReferenceDraft(draft.channel)
				: undefined,
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
		};
		return this.saveNew(context, resource);
	}

	transformChannelReferenceDraft(
		channel: ChannelResourceIdentifier,
	): ChannelReference {
		return {
			typeId: channel.typeId,
			id: channel.id as string,
		};
	}

	transformDiscountDraft(discounted: DiscountedPriceDraft) {
		return {
			value: createTypedMoney(discounted.value),
			discount: discounted.discount,
		};
	}

	actions = {
		setActive: (
			context: RepositoryContext,
			resource: Writable<StandalonePrice>,
			action: StandalonePriceChangeActiveAction,
		) => {
			resource.active = action.active;
		},
		changeValue: (
			context: RepositoryContext,
			resource: Writable<StandalonePrice>,
			action: StandalonePriceChangeValueAction,
		) => {
			resource.value = createTypedMoney(action.value);
		},
		setDiscountedPrice: (
			context: RepositoryContext,
			resource: Writable<StandalonePrice>,
			action: StandalonePriceSetDiscountedPriceAction,
		) => {
			resource.discounted = action.discounted
				? this.transformDiscountDraft(action.discounted)
				: undefined;
		},
	};
}
