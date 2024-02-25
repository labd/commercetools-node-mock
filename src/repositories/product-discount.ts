import type {
	ProductDiscount,
	ProductDiscountChangeIsActiveAction,
	ProductDiscountChangeNameAction,
	ProductDiscountChangePredicateAction,
	ProductDiscountChangeSortOrderAction,
	ProductDiscountChangeValueAction,
	ProductDiscountDraft,
	ProductDiscountSetDescriptionAction,
	ProductDiscountSetKeyAction,
	ProductDiscountSetValidFromAction,
	ProductDiscountSetValidFromAndUntilAction,
	ProductDiscountSetValidUntilAction,
	ProductDiscountUpdateAction,
	ProductDiscountValue,
	ProductDiscountValueAbsolute,
	ProductDiscountValueDraft,
	ProductDiscountValueExternal,
	ProductDiscountValueRelative,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import { AbstractResourceRepository, RepositoryContext } from "./abstract";
import { createTypedMoney } from "./helpers";

export class ProductDiscountRepository extends AbstractResourceRepository<"product-discount"> {
	getTypeId() {
		return "product-discount" as const;
	}

	create(
		context: RepositoryContext,
		draft: ProductDiscountDraft,
	): ProductDiscount {
		const resource: ProductDiscount = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			value: this.transformValueDraft(draft.value),
			predicate: draft.predicate,
			sortOrder: draft.sortOrder,
			isActive: draft.isActive || false,
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
			references: [],
		};
		return this.saveNew(context, resource);
	}

	private transformValueDraft(
		value: ProductDiscountValueDraft,
	): ProductDiscountValue {
		switch (value.type) {
			case "absolute": {
				return {
					type: "absolute",
					money: value.money.map(createTypedMoney),
				} as ProductDiscountValueAbsolute;
			}
			case "external": {
				return {
					type: "external",
				} as ProductDiscountValueExternal;
			}
			case "relative": {
				return {
					...value,
				} as ProductDiscountValueRelative;
			}
		}
	}

	actions: Partial<
		Record<
			ProductDiscountUpdateAction["action"],
			(
				context: RepositoryContext,
				resource: Writable<ProductDiscount>,
				action: any,
			) => void
		>
	> = {
		setKey: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ key }: ProductDiscountSetKeyAction,
		) => {
			resource.key = key;
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ description }: ProductDiscountSetDescriptionAction,
		) => {
			if (description && Object.keys(description).length > 0) {
				resource.description = description;
			} else {
				resource.description = undefined;
			}
		},
		changeName: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ name }: ProductDiscountChangeNameAction,
		) => {
			resource.name = name;
		},
		changeValue: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ value }: ProductDiscountChangeValueAction,
		) => {
			resource.value = this.transformValueDraft(value);
		},
		changePredicate: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ predicate }: ProductDiscountChangePredicateAction,
		) => {
			resource.predicate = predicate;
		},
		changeSortOrder: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ sortOrder }: ProductDiscountChangeSortOrderAction,
		) => {
			resource.sortOrder = sortOrder;
		},
		changeIsActive: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ isActive }: ProductDiscountChangeIsActiveAction,
		) => {
			resource.isActive = isActive;
		},
		setValidFrom: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ validFrom }: ProductDiscountSetValidFromAction,
		) => {
			resource.validFrom = validFrom;
		},
		setValidUntil: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ validUntil }: ProductDiscountSetValidUntilAction,
		) => {
			resource.validUntil = validUntil;
		},
		setValidFromAndUntil: (
			context: RepositoryContext,
			resource: Writable<ProductDiscount>,
			{ validFrom, validUntil }: ProductDiscountSetValidFromAndUntilAction,
		) => {
			resource.validFrom = validFrom;
			resource.validUntil = validUntil;
		},
	};
}
