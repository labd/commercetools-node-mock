import assert from "node:assert";
import type {
	RecurringOrder,
	RecurringOrderDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { OrderRepository } from "../order/index.ts";
import { RecurringOrderUpdateHandler } from "./actions.ts";

export class RecurringOrderRepository extends AbstractResourceRepository<"recurring-order"> {
	constructor(config: Config) {
		super("recurring-order", config);
		this.actions = new RecurringOrderUpdateHandler(config.storage);
	}

	create(
		context: RepositoryContext,
		draft: RecurringOrderDraft,
	): RecurringOrder {
		assert(draft.cart, "draft.cart is missing");

		const orderRepo = new OrderRepository(this.config);

		const initialOrder = orderRepo.createFromCart(context, {
			id: draft.cart.id!,
			typeId: "cart",
		});

		const resource: RecurringOrder = {
			...getBaseResourceProperties(),
			key: draft.key,
			cart: {
				typeId: "cart",
				id: draft.cart.id!,
			},
			originOrder: {
				typeId: "order",
				id: initialOrder.id,
			},
			startsAt: draft.startsAt,
			expiresAt: draft.expiresAt,
			recurringOrderState: "Active",
			schedule: { type: "standard", intervalUnit: "month", value: 1 },
		};
		return this.saveNew(context, resource);
	}
}
