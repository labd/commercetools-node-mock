import assert from "node:assert";
import type {
	CartReference,
	MyOrderFromCartDraft,
	Order,
} from "@commercetools/platform-sdk";
import type { RepositoryContext } from "./abstract.ts";
import { OrderRepository } from "./order/index.ts";

export class MyOrderRepository extends OrderRepository {
	create(context: RepositoryContext, draft: MyOrderFromCartDraft): Order {
		assert(draft.id, "draft.id is missing");
		const cartIdentifier = {
			id: draft.id,
			typeId: "cart",
		} as CartReference;
		return this.createFromCart(context, cartIdentifier);
	}
}
