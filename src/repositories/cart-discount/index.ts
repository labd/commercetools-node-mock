import type {
	CartDiscount,
	CartDiscountDraft,
	CartDiscountValueAbsolute,
	CartDiscountValueDraft,
	CartDiscountValueFixed,
	CartDiscountValueGiftLineItem,
	CartDiscountValueRelative,
	DiscountGroupReference,
	DiscountGroupResourceIdentifier,
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
	getReferenceFromResourceIdentifier,
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

		const discountGroup = await this.discountGroupReference(
			context,
			draft.discountGroup,
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
			// A discount in a group takes the group's sort order.
			sortOrder:
				(await this.discountGroupSortOrder(context, discountGroup)) ??
				draft.sortOrder ??
				"0.1",
			discountGroup,
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

	async discountGroupReference(
		context: RepositoryContext,
		identifier: DiscountGroupResourceIdentifier | undefined,
	): Promise<DiscountGroupReference | undefined> {
		if (!identifier) return undefined;
		const reference =
			await getReferenceFromResourceIdentifier<DiscountGroupReference>(
				identifier,
				context.projectKey,
				this._storage,
			);
		return { typeId: "discount-group", id: reference.id };
	}

	async discountGroupSortOrder(
		context: RepositoryContext,
		reference: DiscountGroupReference | undefined,
	): Promise<string | undefined> {
		if (!reference) return undefined;
		const group = await this._storage.get(
			context.projectKey,
			"discount-group",
			reference.id,
		);
		return group?.sortOrder;
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
