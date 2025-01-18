import type {
	CustomerReference,
	LineItemDraft,
	ProductPagedQueryResponse,
	ShoppingList,
	ShoppingListDraft,
	ShoppingListLineItem,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "../../helpers";
import type { Writable } from "../../types";
import type { RepositoryContext } from "../abstract";
import { AbstractResourceRepository } from "../abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
	getStoreKeyReference,
} from "../helpers";
import { ShoppingListUpdateHandler } from "./actions";

export class ShoppingListRepository extends AbstractResourceRepository<"shopping-list"> {
	constructor(config: Config) {
		super("shopping-list", config);
		this.actions = new ShoppingListUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: ShoppingListDraft): ShoppingList {
		const lineItems =
			draft.lineItems?.map((draftLineItem) =>
				this.draftLineItemtoLineItem(context.projectKey, draftLineItem),
			) ?? [];

		const resource: ShoppingList = {
			...getBaseResourceProperties(),
			...draft,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			textLineItems: [],
			lineItems,
			customer: draft.customer
				? getReferenceFromResourceIdentifier<CustomerReference>(
						draft.customer,
						context.projectKey,
						this._storage,
					)
				: undefined,
			store: draft.store
				? getStoreKeyReference(draft.store, context.projectKey, this._storage)
				: undefined,
		};
		return this.saveNew(context, resource);
	}

	draftLineItemtoLineItem = (
		projectKey: string,
		draftLineItem: LineItemDraft,
	): ShoppingListLineItem => {
		const { sku, productId, variantId } = draftLineItem;

		const lineItem: Writable<ShoppingListLineItem> = {
			...getBaseResourceProperties(),
			...draftLineItem,
			addedAt: draftLineItem.addedAt ?? "",
			productId: draftLineItem.productId ?? "",
			name: {},
			variantId,
			quantity: draftLineItem.quantity ?? 1,
			productType: { typeId: "product-type", id: "" },
			custom: createCustomFields(
				draftLineItem.custom,
				projectKey,
				this._storage,
			),
		};

		if (productId && variantId) {
			return lineItem;
		}

		if (sku) {
			const items = this._storage.query(projectKey, "product", {
				where: [
					`masterData(current(masterVariant(sku="${sku}"))) or masterData(current(variants(sku="${sku}")))`,
				],
			}) as ProductPagedQueryResponse;

			if (items.count === 0) {
				throw new Error(`Product with sku ${sku} not found`);
			}

			const product = items.results[0];
			const allVariants = [
				product.masterData.current.masterVariant,
				...product.masterData.current.variants,
			];
			const variantId = allVariants.find((e) => e.sku === sku)?.id;
			lineItem.variantId = variantId;
			lineItem.productId = product.id;
			return lineItem;
		}

		if (productId) {
			const items = this._storage.query(projectKey, "product", {
				where: [`id="${productId}"`],
			}) as ProductPagedQueryResponse;

			if (items.count === 0) {
				throw new Error(`Product with id ${productId} not found`);
			}

			const variantId = items.results[0].masterData.current.masterVariant.id;
			lineItem.variantId = variantId;
			return lineItem;
		}

		throw new Error(
			`must provide either sku, productId or variantId for ShoppingListLineItem`,
		);
	};
}
