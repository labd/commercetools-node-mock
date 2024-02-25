import type {
	ProductSelection,
	ProductSelectionChangeNameAction,
	ProductSelectionDraft,
	ProductSelectionUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";

export class ProductSelectionRepository extends AbstractResourceRepository<"product-selection"> {
	getTypeId() {
		return "product-selection" as const;
	}

	create(
		context: RepositoryContext,
		draft: ProductSelectionDraft,
	): ProductSelection {
		const resource: ProductSelection = {
			...getBaseResourceProperties(),
			productCount: 0,
			key: draft.key,
			name: draft.name,
			mode: "Individual",
		};
		return this.saveNew(context, resource);
	}

	actions: Partial<
		Record<
			ProductSelectionUpdateAction["action"],
			(
				context: RepositoryContext,
				resource: Writable<ProductSelection>,
				action: any,
			) => void
		>
	> = {
		changeName: (
			context: RepositoryContext,
			resource: Writable<ProductSelection>,
			{ name }: ProductSelectionChangeNameAction,
		) => {
			resource.name = name;
		},
	};
}
