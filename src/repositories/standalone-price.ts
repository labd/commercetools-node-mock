import type {
	ChannelReference,
	ChannelResourceIdentifier,
	DiscountedPriceDraft,
	StandalonePrice,
	StandalonePriceChangeActiveAction,
	StandalonePriceChangeValueAction,
	StandalonePriceDraft,
	StandalonePriceSetDiscountedPriceAction,
	StandalonePriceUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "./abstract";
import { createTypedMoney } from "./helpers";

export class StandAlonePriceRepository extends AbstractResourceRepository<"standalone-price"> {
	constructor(storage: AbstractStorage) {
		super("standalone-price", storage);
		this.actions = new StandalonePriceUpdateHandler(this._storage);
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
				? transformDiscountDraft(draft.discounted)
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
}

const transformDiscountDraft = (discounted: DiscountedPriceDraft) => ({
	value: createTypedMoney(discounted.value),
	discount: discounted.discount,
});

class StandalonePriceUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<
			UpdateHandlerInterface<StandalonePrice, StandalonePriceUpdateAction>
		>
{
	setActive(
		context: RepositoryContext,
		resource: Writable<StandalonePrice>,
		action: StandalonePriceChangeActiveAction,
	) {
		resource.active = action.active;
	}

	changeValue(
		context: RepositoryContext,
		resource: Writable<StandalonePrice>,
		action: StandalonePriceChangeValueAction,
	) {
		resource.value = createTypedMoney(action.value);
	}

	setDiscountedPrice(
		context: RepositoryContext,
		resource: Writable<StandalonePrice>,
		action: StandalonePriceSetDiscountedPriceAction,
	) {
		resource.discounted = action.discounted
			? transformDiscountDraft(action.discounted)
			: undefined;
	}
}
