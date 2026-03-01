import type {
	CustomerReference,
	LineItemDraft,
	ProductPagedQueryResponse,
	ReferencedResourceNotFoundError,
	ShoppingList,
	ShoppingListDraft,
	ShoppingListLineItem,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { ShoppingListDraftSchema } from "#src/schemas/generated/shopping-list.ts";
import { getBaseResourceProperties } from "../../helpers.ts";
import type { Writable } from "../../types.ts";
import type { RepositoryContext } from "../abstract.ts";
import { AbstractResourceRepository } from "../abstract.ts";
import {
	createCustomFields,
	getBusinessUnitKeyReference,
	getReferenceFromResourceIdentifier,
	getStoreKeyReference,
} from "../helpers.ts";
import { ShoppingListUpdateHandler } from "./actions.ts";

export class ShoppingListRepository extends AbstractResourceRepository<"shopping-list"> {
	constructor(config: Config) {
		super("shopping-list", config);
		this.actions = new ShoppingListUpdateHandler(config.storage);
		this.draftSchema = ShoppingListDraftSchema;
	}

	create(context: RepositoryContext, draft: ShoppingListDraft): ShoppingList {
		const lineItems =
			draft.lineItems?.map((draftLineItem) =>
				this.draftLineItemtoLineItem(context.projectKey, draftLineItem),
			) ?? [];

		const resource: ShoppingList = {
			...getBaseResourceProperties(context.clientId),
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
			businessUnit: draft.businessUnit
				? getBusinessUnitKeyReference(
						draft.businessUnit,
						context.projectKey,
						this._storage,
					)
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
			published: true,
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
				throw new CommercetoolsError<ReferencedResourceNotFoundError>({
					code: "ReferencedResourceNotFound",
					message: `Product with sku ${sku} not found`,
					typeId: "product",
				});
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
				throw new CommercetoolsError<ReferencedResourceNotFoundError>({
					code: "ReferencedResourceNotFound",
					message: `Product with id ${productId} not found`,
					typeId: "product",
				});
			}

			const variantId = items.results[0].masterData.current.masterVariant.id;
			lineItem.variantId = variantId;
			return lineItem;
		}

		throw new CommercetoolsError<ReferencedResourceNotFoundError>({
			code: "ReferencedResourceNotFound",
			message:
				"must provide either sku, productId or variantId for ShoppingListLineItem",
			typeId: "product",
		});
	};
}
