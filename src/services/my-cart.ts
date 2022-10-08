import AbstractService from './abstract'
import { Request, Response, Router } from 'express'
import { CartRepository } from '../repositories/cart'

export class MyCartService extends AbstractService {
  public repository: CartRepository

  constructor(parent: Router, repository: CartRepository) {
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

    router.get('/active-cart', this.activeCart.bind(this))
    router.get('/carts/', this.get.bind(this))
    router.get('/carts/:id', this.getWithId.bind(this))

    router.delete('/carts/:id', this.deleteWithId.bind(this))

    router.post('/carts/', this.post.bind(this))
    router.post('/carts/:id', this.postWithId.bind(this))

    parent.use(`/${basePath}`, router)
  }

  activeCart(request: Request, response: Response) {
    const resource = this.repository.getActiveCart(request.params.projectKey)
    if (!resource) {
      return response.status(404).send('Not found')
    }
    return response.status(200).send(resource)
  }
}
