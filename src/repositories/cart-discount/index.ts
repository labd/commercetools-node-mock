import type {
	CartDiscount,
	CartDiscountDraft,
	CartDiscountValueAbsolute,
	CartDiscountValueDraft,
	CartDiscountValueFixed,
	CartDiscountValueGiftLineItem,
	CartDiscountValueRelative,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import {
	createCustomFields,
	createTypedMoney,
	getStoreKeyReference,
} from "../helpers";
import { CartDiscountUpdateHandler } from "./actions";

export class CartDiscountRepository extends AbstractResourceRepository<"cart-discount"> {
	constructor(config: Config) {
		super("cart-discount", config);
		this.actions = new CartDiscountUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: CartDiscountDraft): CartDiscount {
		const resource: CartDiscount = {
			...getBaseResourceProperties(),
			key: draft.key,
			description: draft.description,
			cartPredicate: draft.cartPredicate,
			isActive: draft.isActive || false,
			name: draft.name,
			stores:
				draft.stores?.map((s) =>
					getStoreKeyReference(s, context.projectKey, this._storage),
				) ?? [],
			references: [],
			target: draft.target,
			requiresDiscountCode: draft.requiresDiscountCode || false,
			sortOrder: draft.sortOrder,
			stackingMode: draft.stackingMode || "Stacking",
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
			value: this.transformValueDraft(draft.value),
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
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
