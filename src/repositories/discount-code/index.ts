import type {
	CartDiscountReference,
	DiscountCode,
	DiscountCodeDraft,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "~src/helpers";
import type { AbstractStorage } from "~src/storage/abstract";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { createCustomFields } from "../helpers";
import { DiscountCodeUpdateHandler } from "./actions";

export class DiscountCodeRepository extends AbstractResourceRepository<"discount-code"> {
	constructor(storage: AbstractStorage) {
		super("discount-code", storage);
		this.actions = new DiscountCodeUpdateHandler(storage);
	}

	create(context: RepositoryContext, draft: DiscountCodeDraft): DiscountCode {
		const resource: DiscountCode = {
			...getBaseResourceProperties(),
			applicationVersion: 1,
			cartDiscounts: draft.cartDiscounts.map(
				(obj): CartDiscountReference => ({
					typeId: "cart-discount",
					id: obj.id!,
				}),
			),
			cartPredicate: draft.cartPredicate,
			code: draft.code,
			description: draft.description,
			groups: draft.groups || [],
			isActive: draft.isActive || true,
			name: draft.name,
			references: [],
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
			maxApplications: draft.maxApplications,
			maxApplicationsPerCustomer: draft.maxApplicationsPerCustomer,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}
