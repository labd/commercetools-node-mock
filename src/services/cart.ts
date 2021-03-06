import AbstractService from './abstract'
import { Router } from 'express'
import { CartRepository } from '../repositories/cart'
import { AbstractStorage } from '../storage'
import { Cart, CartDraft, Order } from '@commercetools/platform-sdk'
import { OrderRepository } from '../repositories/order'
import { getRepositoryContext } from '../repositories/helpers'

export class CartService extends AbstractService {
  public repository: CartRepository
  public orderRepository: OrderRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new CartRepository(storage)
    this.orderRepository = new OrderRepository(storage)
  }

  getBasePath() {
    return 'carts'
  }

  extraRoutes(parent: Router) {
    parent.post('/replicate', (request, response) => {
      const context = getRepositoryContext(request)

      // @ts-ignore
      const cartOrOrder: Cart | Order | null =
        request.body.reference.typeId === 'order'
          ? this.orderRepository.get(context, request.body.reference.id)
          : this.repository.get(context, request.body.reference.id)

      if (!cartOrOrder) {
        return response.status(400).send()
      }

      const cartDraft: CartDraft = {
        ...cartOrOrder,
        currency: cartOrOrder.totalPrice.currencyCode,
        discountCodes: [],
        lineItems: cartOrOrder.lineItems.map(lineItem => {
          return {
            ...lineItem,
            variantId: lineItem.variant.id,
            sku: lineItem.variant.sku,
          }
        }),
      }

      const newCart = this.repository.create(context, cartDraft)

      return response.status(200).send(newCart)
    })
  }
}
