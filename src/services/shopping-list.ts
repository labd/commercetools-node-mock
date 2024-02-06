import { Request, Router } from 'express'
import { getRepositoryContext } from '../repositories/helpers.js'
import { ProductRepository } from '../repositories/product.js'
import { ShoppingListRepository } from './../repositories/shopping-list.js'
import AbstractService from './abstract.js'

export class ShoppingListService extends AbstractService {
	public repository: ShoppingListRepository
	public productRepository: ProductRepository

	constructor(
		parent: Router,
		repository: ShoppingListRepository,
		productRepository: ProductRepository
	) {
		super(parent)
		this.repository = repository
		this.productRepository = productRepository
	}

	getBasePath() {
		return 'shopping-lists'
	}

	// variants on ShoppingListLineItem are not normal references
	// so cannot be expanded in the normal way
	protected _expandWithId(request: Request, resourceId: string) {
		const shoppingList = super._expandWithId(request, resourceId)
		const expand = this._parseParam(request.query.expand)
		const context = getRepositoryContext(request)

		if (expand && expand.includes('lineItems[*].variant')) {
			if (shoppingList) {
				const lineItems = shoppingList.lineItems.map((lineItem) => {
					const product = this.productRepository.get(
						context,
						lineItem.productId
					)

					if (!product) return lineItem

					const variant = [
						product.masterData.current.masterVariant,
						...product.masterData.current.variants,
					].find((variant) => variant.id === lineItem.variantId)

					return {
						...lineItem,
						variant,
					}
				})
				shoppingList.lineItems = lineItems
				return shoppingList
			}
		}
		return shoppingList
	}
}
