import type {
	CartDiscount,
	CartDiscountDraft,
	CartDiscountValueAbsolute,
	CartDiscountValueDraft,
	CartDiscountValueFixed,
	CartDiscountValueGiftLineItem,
	CartDiscountValueRelative,
	RecurringOrderScope,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { CartDiscountDraftSchema } from "#src/schemas/generated/cart-discount.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import {
	createCustomFields,
	createTypedMoney,
	getStoreKeyReference,
} from "../helpers.ts";
import { CartDiscountUpdateHandler } from "./actions.ts";

export class CartDiscountRepository extends AbstractResourceRepository<"cart-discount"> {
	constructor(config: Config) {
		super("cart-discount", config);
		this.actions = new CartDiscountUpdateHandler(config.storage);
		this.draftSchema = CartDiscountDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: CartDiscountDraft,
	): Promise<CartDiscount> {
		const stores = await Promise.all(
			draft.stores?.map((s) =>
				getStoreKeyReference(s, context.projectKey, this._storage),
			) ?? [],
		);

		const resource: CartDiscount = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			description: draft.description,
			cartPredicate: draft.cartPredicate,
			isActive: draft.isActive || false,
			name: draft.name,
			stores,
			references: [],
			target: draft.target,
			requiresDiscountCode: draft.requiresDiscountCode || false,
			sortOrder: draft.sortOrder ?? "0.1",
			stackingMode: draft.stackingMode || "Stacking",
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
			value: this.transformValueDraft(draft.value),
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			recurringOrderScope: draft.recurringOrderScope
				? ({ type: draft.recurringOrderScope.type } as RecurringOrderScope)
				: ({ type: "AnyOrder" } as RecurringOrderScope),
		};
		return await this.saveNew(context, resource);
	}

	private transformValueDraft(value: CartDiscountValueDraft) {
		switch (value.type) {
			case "absolute": {
				return {
					type: "absolute",
					money: value.money.map(createTypedMoney),
				} as CartDiscountValueAbsolute;
			}
			case "fixed": {
				return {
					type: "fixed",
					money: value.money.map(createTypedMoney),
				} as CartDiscountValueFixed;
			}
			case "giftLineItem": {
				return {
					...value,
				} as CartDiscountValueGiftLineItem;
			}
			case "relative": {
				return {
					...value,
				} as CartDiscountValueRelative;
			}
		}
	}
}
