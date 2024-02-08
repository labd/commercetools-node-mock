import type {
	CustomerReference,
	GeneralError,
	LineItemDraft,
	Product,
	ProductPagedQueryResponse,
	ShoppingList,
	ShoppingListAddLineItemAction,
	ShoppingListChangeLineItemQuantityAction,
	ShoppingListChangeNameAction,
	ShoppingListDraft,
	ShoppingListLineItem,
	ShoppingListRemoveLineItemAction,
	ShoppingListSetAnonymousIdAction,
	ShoppingListSetCustomFieldAction,
	ShoppingListSetCustomTypeAction,
	ShoppingListSetCustomerAction,
	ShoppingListSetDeleteDaysAfterLastModificationAction,
	ShoppingListSetDescriptionAction,
	ShoppingListSetKeyAction,
	ShoppingListSetSlugAction,
	ShoppingListSetStoreAction,
} from '@commercetools/platform-sdk'
import { v4 as uuidv4 } from 'uuid'
import { CommercetoolsError } from '../exceptions.js'
import { getBaseResourceProperties } from '../helpers.js'
import { Writable } from '../types.js'
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

	actions = {
		setKey: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ key }: ShoppingListSetKeyAction
		) => {
			resource.key = key
		},
		setSlug: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ slug }: ShoppingListSetSlugAction
		) => {
			resource.slug = slug
		},
		changeName: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ name }: ShoppingListChangeNameAction
		) => {
			resource.name = name
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ description }: ShoppingListSetDescriptionAction
		) => {
			resource.description = description
		},
		setCustomer: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ customer }: ShoppingListSetCustomerAction
		) => {
			if (customer?.key) {
				throw new Error('set customer on shoppinglist by key not implemented')
			}
			if (customer?.id) {
				resource.customer = { typeId: 'customer', id: customer.id }
			}
		},
		setStore: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ store }: ShoppingListSetStoreAction
		) => {
			if (store?.key) {
				resource.store = { typeId: 'store', key: store.key }
			}
			if (store?.id) {
				throw new Error('set store on shoppinglist by id not implemented')
			}
		},
		setAnonymousId: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ anonymousId }: ShoppingListSetAnonymousIdAction
		) => {
			resource.anonymousId = anonymousId
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ type, fields }: ShoppingListSetCustomTypeAction
		) => {
			if (!type) {
				resource.custom = undefined
			} else {
				const resolvedType = this._storage.getByResourceIdentifier(
					context.projectKey,
					type
				)
				if (!resolvedType) {
					throw new Error(`Type ${type} not found`)
				}

				resource.custom = {
					type: {
						typeId: 'type',
						id: resolvedType.id,
					},
					fields: fields || {},
				}
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: ShoppingList,
			{ name, value }: ShoppingListSetCustomFieldAction
		) => {
			if (!resource.custom) {
				throw new Error('Resource has no custom field')
			}
			resource.custom.fields[name] = value
		},
		setDeleteDaysAfterLastModification: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{
				deleteDaysAfterLastModification,
			}: ShoppingListSetDeleteDaysAfterLastModificationAction
		) => {
			resource.deleteDaysAfterLastModification = deleteDaysAfterLastModification
		},
		addLineItem: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ productId, variantId, sku, quantity = 1 }: ShoppingListAddLineItemAction
		) => {
			let product: Product | null = null

			if (productId) {
				// Fetch product and variant by ID
				product = this._storage.get(
					context.projectKey,
					'product',
					productId,
					{}
				)
			} else if (sku) {
				// Fetch product and variant by SKU
				const items = this._storage.query(context.projectKey, 'product', {
					where: [
						`masterData(current(masterVariant(sku="${sku}"))) or masterData(current(variants(sku="${sku}")))`,
					],
				}) as ProductPagedQueryResponse

				if (items.count === 1) {
					product = items.results[0]
				}
			}

			if (!product) {
				// Check if product is found
				throw new CommercetoolsError<GeneralError>({
					code: 'General',
					message: sku
						? `A product containing a variant with SKU '${sku}' not found.`
						: `A product with ID '${productId}' not found.`,
				})
			}

			let varId: number | undefined = variantId
			if (sku) {
				varId = [
					product.masterData.current.masterVariant,
					...product.masterData.current.variants,
				].find((x) => x.sku === sku)?.id
			}
			if (!varId) {
				varId = product.masterData.current.masterVariant.id
			}

			const alreadyAdded = resource.lineItems.some(
				(x) => x.productId === product?.id && x.variantId === varId
			)
			if (alreadyAdded) {
				// increase quantity and update total price
				resource.lineItems.forEach((x) => {
					if (x.productId === product?.id && x.variantId === varId) {
						x.quantity += quantity
					}
				})
			} else {
				// add line item
				resource.lineItems.push({
					addedAt: new Date().toISOString(),
					id: uuidv4(),
					productId: product.id,
					productSlug: product.masterData.current.slug,
					productType: product.productType,
					name: product.masterData.current.name,
					variantId: varId,
					quantity,
				})
			}
		},
		removeLineItem: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{ lineItemId, quantity }: ShoppingListRemoveLineItemAction
		) => {
			const lineItem = resource.lineItems.find((x) => x.id === lineItemId)
			if (!lineItem) {
				// Check if product is found
				throw new CommercetoolsError<GeneralError>({
					code: 'General',
					message: `A line item with ID '${lineItemId}' not found.`,
				})
			}

			const shouldDelete = !quantity || quantity >= lineItem.quantity
			if (shouldDelete) {
				// delete line item
				resource.lineItems = resource.lineItems.filter(
					(x) => x.id !== lineItemId
				)
			} else {
				// decrease quantity and update total price
				resource.lineItems.forEach((x) => {
					if (x.id === lineItemId && quantity) {
						x.quantity -= quantity
					}
				})
			}
		},
		changeLineItemQuantity: (
			context: RepositoryContext,
			resource: Writable<ShoppingList>,
			{
				lineItemId,
				lineItemKey,
				quantity,
			}: ShoppingListChangeLineItemQuantityAction
		) => {
			let lineItem: Writable<ShoppingListLineItem> | undefined

			if (lineItemId) {
				lineItem = resource.lineItems.find((x) => x.id === lineItemId)
				if (!lineItem) {
					throw new CommercetoolsError<GeneralError>({
						code: 'General',
						message: `A line item with ID '${lineItemId}' not found.`,
					})
				}
			} else if (lineItemKey) {
				lineItem = resource.lineItems.find((x) => x.id === lineItemId)
				if (!lineItem) {
					throw new CommercetoolsError<GeneralError>({
						code: 'General',
						message: `A line item with Key '${lineItemKey}' not found.`,
					})
				}
			} else {
				throw new CommercetoolsError<GeneralError>({
					code: 'General',
					message: `Either lineItemid or lineItemKey needs to be provided.`,
				})
			}

			if (quantity === 0) {
				// delete line item
				resource.lineItems = resource.lineItems.filter(
					(x) => x.id !== lineItemId
				)
			} else {
				resource.lineItems.forEach((x) => {
					if (x.id === lineItemId && quantity) {
						x.quantity = quantity
					}
				})
			}
		},
	}

	draftLineItemtoLineItem = (
		projectKey: string,
		draftLineItem: LineItemDraft
	): ShoppingListLineItem => {
		const { sku, productId, variantId } = draftLineItem

		const lineItem: Writable<ShoppingListLineItem> = {
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

		if (productId && variantId) {
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
			lineItem.variantId = variantId
			lineItem.productId = product.id
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
			lineItem.variantId = variantId
			return lineItem
		}

		throw new Error(
			`must provide either sku, productId or variantId for ShoppingListLineItem`
		)
	}
}
