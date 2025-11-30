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
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";
import { createTypedMoney } from "./helpers.ts";

export class StandAlonePriceRepository extends AbstractResourceRepository<"standalone-price"> {
	constructor(config: Config) {
		super("standalone-price", config);
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
	changeValue(
		context: RepositoryContext,
		resource: Writable<StandalonePrice>,
		action: StandalonePriceChangeValueAction,
	) {
		resource.value = createTypedMoney(action.value);
	}

	setActive(
		context: RepositoryContext,
		resource: Writable<StandalonePrice>,
		action: StandalonePriceChangeActiveAction,
	) {
		resource.active = action.active;
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
