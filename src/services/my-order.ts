import AbstractService from './abstract'
import { Router } from 'express'
import { AbstractStorage } from '../storage'
import { MyOrderRepository } from '../repositories/my-order'

export class MyOrderService extends AbstractService {
  public repository: MyOrderRepository

  constructor(parent: Router, storage: AbstractStorage) {
    super(parent)
    this.repository = new MyOrderRepository(storage)
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
