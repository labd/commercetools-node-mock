import type {
	CustomerReference,
	LineItemDraft,
	ProductPagedQueryResponse,
	ShoppingList,
	ShoppingListDraft,
	ShoppingListLineItem,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
	getStoreKeyReference,
} from './helpers.js'

export class ShoppingListRepository extends AbstractResourceRepository<'shopping-list'> {
	getTypeId() {
		return 'shopping-list' as const
	}

	create(context: RepositoryContext, draft: ShoppingListDraft): ShoppingList {
		const lineItems =
			draft.lineItems?.map((draftLineItem) =>
				this.draftLineItemtoLineItem(context.projectKey, draftLineItem)
			) ?? []

		const resource: ShoppingList = {
			...getBaseResourceProperties(),
			...draft,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage
			),
			textLineItems: [],
			lineItems,
			customer: draft.customer
				? getReferenceFromResourceIdentifier<CustomerReference>(
						draft.customer,
						context.projectKey,
						this._storage
					)
				: undefined,
			store: draft.store
				? getStoreKeyReference(draft.store, context.projectKey, this._storage)
				: undefined,
		}
		this.saveNew(context, resource)
		return resource
	}

	draftLineItemtoLineItem = (
		projectKey: string,
		draftLineItem: LineItemDraft
	): ShoppingListLineItem => {
		const { sku, productId, variantId } = draftLineItem

		const lineItem: ShoppingListLineItem = {
			...getBaseResourceProperties(),
			...draftLineItem,
			addedAt: draftLineItem.addedAt ?? '',
			productId: draftLineItem.productId ?? '',
			name: {},
			variantId,
			quantity: draftLineItem.quantity ?? 1,
			productType: { typeId: 'product-type', id: '' },
			custom: createCustomFields(
				draftLineItem.custom,
				projectKey,
				this._storage
			),
		}

		if (variantId) {
			return lineItem
		}

		if (sku) {
			const items = this._storage.query(projectKey, 'product', {
				where: [
					`masterData(current(masterVariant(sku="${sku}"))) or masterData(current(variants(sku="${sku}")))`,
				],
			}) as ProductPagedQueryResponse

			if (items.count === 0) {
				throw new Error(`Product with sku ${sku} not found`)
			}

			const product = items.results[0]
			const allVariants = [
				product.masterData.current.masterVariant,
				...product.masterData.current.variants,
			]
			const variantId = allVariants.find((e) => e.sku === sku)?.id
			// @ts-ignore
			lineItem.variantId = variantId
			return lineItem
		}

		if (productId) {
			const items = this._storage.query(projectKey, 'product', {
				where: [`id="${productId}"`],
			}) as ProductPagedQueryResponse

			if (items.count === 0) {
				throw new Error(`Product with id ${productId} not found`)
			}

			const variantId = items.results[0].masterData.current.masterVariant.id
			// @ts-ignore
			lineItem.variantId = variantId
			return lineItem
		}

		throw new Error(
			`must provide either sku, productId or variantId for ShoppingListLineItem`
		)
	}
}
