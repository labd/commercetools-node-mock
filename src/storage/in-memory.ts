import {
	InvalidJsonInputError,
	ReferencedResourceNotFoundError,
	ShoppingListLineItem,
	type AssociateRole,
	type AttributeGroup,
	type BusinessUnit,
	type Cart,
	type CartDiscount,
	type Category,
	type Channel,
	type CustomObject,
	type Customer,
	type CustomerGroup,
	type DiscountCode,
	type Extension,
	type InvalidInputError,
	type InventoryEntry,
	type Order,
	type PagedQueryResponse,
	type Payment,
	type Product,
	type ProductDiscount,
	type ProductProjection,
	type ProductType,
	type Project,
	type Quote,
	type QuoteRequest,
	type Reference,
	type ResourceIdentifier,
	type ShippingMethod,
	type ShoppingList,
	type StagedQuote,
	type State,
	type Store,
	type Subscription,
	type TaxCategory,
	type Type,
	type Zone,
} from '@commercetools/platform-sdk'
import assert from 'assert'
import { CommercetoolsError } from '../exceptions.js'
import { cloneObject } from '../helpers.js'
import { parseExpandClause } from '../lib/expandParser.js'
import { parseQueryExpression } from '../lib/predicateParser.js'
import {
	PagedQueryResponseMap,
	ResourceMap,
	ResourceType,
	Writable,
} from '../types.js'
import {
	AbstractStorage,
	GetParams,
	ProjectStorage,
	QueryParams,
} from './abstract.js'

export class InMemoryStorage extends AbstractStorage {
	protected resources: {
		[projectKey: string]: ProjectStorage
	} = {}

	protected projects: {
		[projectKey: string]: Project
	} = {}

	private forProjectKey(projectKey: string): ProjectStorage {
		this.addProject(projectKey)

		let projectStorage = this.resources[projectKey]
		if (!projectStorage) {
			projectStorage = this.resources[projectKey] = {
				'associate-role': new Map<string, AssociateRole>(),
				'attribute-group': new Map<string, AttributeGroup>(),
				'business-unit': new Map<string, BusinessUnit>(),
				cart: new Map<string, Cart>(),
				'cart-discount': new Map<string, CartDiscount>(),
				category: new Map<string, Category>(),
				channel: new Map<string, Channel>(),
				customer: new Map<string, Customer>(),
				'customer-group': new Map<string, CustomerGroup>(),
				'discount-code': new Map<string, DiscountCode>(),
				extension: new Map<string, Extension>(),
				'inventory-entry': new Map<string, InventoryEntry>(),
				'key-value-document': new Map<string, CustomObject>(),
				order: new Map<string, Order>(),
				'order-edit': new Map<string, any>(),
				payment: new Map<string, Payment>(),
				product: new Map<string, Product>(),
				quote: new Map<string, Quote>(),
				'quote-request': new Map<string, QuoteRequest>(),
				'product-discount': new Map<string, ProductDiscount>(),
				'product-selection': new Map<string, any>(),
				'product-type': new Map<string, ProductType>(),
				'product-projection': new Map<string, ProductProjection>(),
				review: new Map<string, any>(),
				'shipping-method': new Map<string, ShippingMethod>(),
				'staged-quote': new Map<string, StagedQuote>(),
				state: new Map<string, State>(),
				store: new Map<string, Store>(),
				'shopping-list': new Map<string, ShoppingList>(),
				'standalone-price': new Map<string, any>(),
				subscription: new Map<string, Subscription>(),
				'tax-category': new Map<string, TaxCategory>(),
				type: new Map<string, Type>(),
				zone: new Map<string, Zone>(),
			}
		}
		return projectStorage
	}

	clear() {
		for (const [, projectStorage] of Object.entries(this.resources)) {
			for (const [, value] of Object.entries(projectStorage)) {
				value?.clear()
			}
		}
	}

	all<RT extends ResourceType>(
		projectKey: string,
		typeId: RT
	): ResourceMap[RT][] {
		const store = this.forProjectKey(projectKey)[typeId]
		if (store) {
			return Array.from(store.values()).map(cloneObject) as ResourceMap[RT][]
		}
		return []
	}

	add<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		obj: ResourceMap[RT],
		params: GetParams = {}
	): ResourceMap[RT] {
		const store = this.forProjectKey(projectKey)
		store[typeId]?.set(obj.id, obj)

		const resource = this.get(projectKey, typeId, obj.id, params)
		assert(resource, `resource of type ${typeId} with id ${obj.id} not created`)
		return cloneObject(resource)
	}

	get<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {}
	): ResourceMap[RT] | null {
		const resource = this.forProjectKey(projectKey)[typeId]?.get(id)
		if (resource) {
			const clone = cloneObject(resource)
			return this.expand(projectKey, clone, params.expand) as ResourceMap[RT]
		}
		return null
	}

	getByKey<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		key: string,
		params: GetParams = {}
	): ResourceMap[RT] | null {
		const store = this.forProjectKey(projectKey)
		const resourceStore = store[typeId]
		if (!store) {
			throw new Error('No type')
		}

		const resources: any[] = Array.from(resourceStore.values())
		const resource = resources.find((e) => e.key === key)
		if (resource) {
			const clone = cloneObject(resource)
			return this.expand(projectKey, clone, params.expand) as ResourceMap[RT]
		}
		return null
	}

	delete<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {}
	): ResourceMap[RT] | null {
		const resource = this.get(projectKey, typeId, id)

		if (resource) {
			this.forProjectKey(projectKey)[typeId]?.delete(id)
			return this.expand(projectKey, resource, params.expand)
		}
		return resource
	}

	query<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		params: QueryParams
	): PagedQueryResponseMap[RT] {
		const store = this.forProjectKey(projectKey)[typeId]
		if (!store) {
			throw new Error('No type')
		}

		let resources = this.all<RT>(projectKey, typeId)

		// Apply predicates
		if (params.where) {
			// Get all key-value pairs starting with 'var.' to pass as variables, removing
			// the 'var.' prefix.
			const vars = Object.fromEntries(
				Object.entries(params)
					.filter(([key]) => key.startsWith('var.'))
					.map(([key, value]) => [key.slice(4), value])
			)

			try {
				const filterFunc = parseQueryExpression(params.where)
				resources = resources.filter((resource) => filterFunc(resource, vars))
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: 'InvalidInput',
						message: (err as any).message,
					},
					400
				)
			}
		}

		// Get the total before slicing the array
		const totalResources = resources.length

		// Apply offset, limit
		const offset = params.offset || 0
		const limit = params.limit || 20
		resources = resources.slice(offset, offset + limit)

		// Expand the resources
		if (params.expand !== undefined) {
			resources = resources.map((resource) =>
				this.expand(projectKey, resource, params.expand)
			)
		}

		return {
			count: totalResources,
			total: resources.length,
			offset: offset,
			limit: limit,
			results: resources.map(cloneObject),
		} as PagedQueryResponseMap[RT]
	}

	search(
		projectKey: string,
		typeId: ResourceType,
		params: QueryParams
	): PagedQueryResponse {
		let resources = this.all(projectKey, typeId)

		// Apply predicates
		if (params.where) {
			try {
				const filterFunc = parseQueryExpression(params.where)
				resources = resources.filter((resource) => filterFunc(resource, {}))
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: 'InvalidInput',
						message: (err as any).message,
					},
					400
				)
			}
		}

		// Get the total before slicing the array
		const totalResources = resources.length

		// Apply offset, limit
		const offset = params.offset || 0
		const limit = params.limit || 20
		resources = resources.slice(offset, offset + limit)

		// Expand the resources
		if (params.expand !== undefined) {
			resources = resources.map((resource) =>
				this.expand(projectKey, resource, params.expand)
			)
		}

		return {
			count: totalResources,
			total: resources.length,
			offset: offset,
			limit: limit,
			results: resources,
		}
	}

	getByResourceIdentifier<RT extends ResourceType>(
		projectKey: string,
		identifier: ResourceIdentifier
	): ResourceMap[RT] {
		if (identifier.id) {
			const resource = this.get(projectKey, identifier.typeId, identifier.id)
			if (resource) {
				return resource as ResourceMap[RT]
			}

			throw new CommercetoolsError<ReferencedResourceNotFoundError>({
				code: 'ReferencedResourceNotFound',
				message:
					`The referenced object of type '${identifier.typeId}' with id ` +
					`'${identifier.id}' was not found. It either doesn't exist, or it ` +
					`can't be accessed from this endpoint (e.g., if the endpoint ` +
					`filters by store or customer account).`,
				typeId: identifier.typeId,
				id: identifier.id,
			})
		}

		if (identifier.key) {
			const resource = this.getByKey(
				projectKey,
				identifier.typeId,
				identifier.key
			)
			if (resource) {
				return resource as ResourceMap[RT]
			}

			throw new CommercetoolsError<ReferencedResourceNotFoundError>({
				code: 'ReferencedResourceNotFound',
				message:
					`The referenced object of type '${identifier.typeId}' with key ` +
					`'${identifier.key}' was not found. It either doesn't exist, or it ` +
					`can't be accessed from this endpoint (e.g., if the endpoint ` +
					`filters by store or customer account).`,
				typeId: identifier.typeId,
				key: identifier.key,
			})
		}
		throw new CommercetoolsError<InvalidJsonInputError>({
			code: 'InvalidJsonInput',
			message: 'Request body does not contain valid JSON.',
			detailedErrorMessage: "ResourceIdentifier requires an 'id' xor a 'key'",
		})
	}

	addProject = (projectKey: string): Project => {
		if (!this.projects[projectKey]) {
			this.projects[projectKey] = {
				key: projectKey,
				name: '',
				countries: [],
				currencies: [],
				languages: [],
				createdAt: '2018-10-04T11:32:12.603Z',
				trialUntil: '2018-12',
				carts: {
					countryTaxRateFallbackEnabled: false,
					deleteDaysAfterLastModification: 90,
				},
				messages: { enabled: false, deleteDaysAfterCreation: 15 },
				shippingRateInputType: undefined,
				externalOAuth: undefined,
				searchIndexing: {
					products: {
						status: 'Deactivated',
					},
					orders: {
						status: 'Deactivated',
					},
				},
				version: 1,
			}
		}
		return this.projects[projectKey]
	}

	saveProject = (project: Project): Project => {
		this.projects[project.key] = project
		return project
	}

	getProject = (projectKey: string): Project => this.addProject(projectKey)

	// Expand resolves a nested reference and injects the object in the given obj
	public expand = <T>(
		projectKey: string,
		obj: T,
		clause: undefined | string | string[]
	): T => {
		if (!clause) return obj
		const newObj = cloneObject(obj)
		if (Array.isArray(clause)) {
			clause.forEach((c) => {
				this._resolveResource(projectKey, newObj, c)
			})
		} else {
			this._resolveResource(projectKey, newObj, clause)
		}
		return newObj
	}

	private _resolveResource = (projectKey: string, obj: any, expand: string) => {
		const params = parseExpandClause(expand)

		// 'lineItems[*].variant' on ShoppingList is an exception, these variants are not references
		if (params.index === '*') {
			const reference = obj[params.element]
			if (
				params.element === 'lineItems' &&
				params.rest?.startsWith('variant') &&
				reference.every(
					(item: any) =>
						item.variant === undefined && item.variantId !== undefined
				)
			) {
				reference.forEach((item: ShoppingListLineItem) => {
					this._resolveShoppingListLineItemVariant(projectKey, item)
				})
			}
		}

		if (!params.index) {
			const reference = obj[params.element]
			if (reference === undefined) {
				return
			}
			this._resolveReference(projectKey, reference, params.rest)
		} else if (params.index === '*') {
			const reference = obj[params.element]
			if (reference === undefined || !Array.isArray(reference)) return
			reference.forEach((itemRef: Writable<Reference>) => {
				this._resolveReference(projectKey, itemRef, params.rest)
			})
		} else {
			const reference = obj[params.element][params.index]
			if (reference === undefined) return
			this._resolveReference(projectKey, reference, params.rest)
		}
	}

	private _resolveReference(
		projectKey: string,
		reference: any,
		expand: string | undefined
	) {
		if (reference === undefined) return

		if (
			reference.typeId !== undefined &&
			(reference.id !== undefined || reference.key !== undefined)
		) {
			// First check if the object is already resolved. This is the case when
			// the complete resource is pushed via the .add() method.
			if (!reference.obj) {
				reference.obj = this.getByResourceIdentifier(projectKey, {
					typeId: reference.typeId,
					id: reference.id,
					key: reference.key,
				} as ResourceIdentifier)
			}
			if (expand) {
				this._resolveResource(projectKey, reference.obj, expand)
			}
		} else {
			if (expand) {
				this._resolveResource(projectKey, reference, expand)
			}
		}
	}
	private _resolveShoppingListLineItemVariant(
		projectKey: string,
		lineItem: ShoppingListLineItem
	) {
		const product = this.getByResourceIdentifier(projectKey, {
			typeId: 'product',
			id: lineItem.productId,
		}) as Product | undefined

		if (!product) {
			return
		}

		const variant = [
			product.masterData.current.masterVariant,
			...product.masterData.current.variants,
		].find((e) => e.id === lineItem.variantId)
		// @ts-ignore
		lineItem.variant = variant
	}
}
