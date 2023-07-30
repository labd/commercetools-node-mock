import { Router } from 'express'
import { MyOrderRepository } from '../repositories/my-order.js'
import AbstractService from './abstract.js'

export class MyOrderService extends AbstractService {
  public repository: MyOrderRepository

  constructor(parent: Router, repository: MyOrderRepository) {
    super(parent)
    this.repository = repository
  }

  getBasePath() {
    return 'me'
  }

  registerRoutes(parent: Router) {
    // Overwrite this function to be able to handle /me/active-cart path.
    const basePath = this.getBasePath()
    const router = Router({ mergeParams: true })

    this.extraRoutes(router)

    router.get('/orders/', this.get.bind(this))
    router.get('/orders/:id', this.getWithId.bind(this))

    router.delete('/orders/:id', this.deleteWithId.bind(this))

    router.post('/orders/', this.post.bind(this))
    router.post('/orders/:id', this.postWithId.bind(this))

    parent.use(`/${basePath}`, router)
  }
}
