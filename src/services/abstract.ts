import { Update } from '@commercetools/platform-sdk'
import { ParsedQs } from 'qs'
import { Request, Response, Router } from 'express'
import { AbstractResourceRepository } from '../repositories/abstract'

export default abstract class AbstractService {
  protected abstract getBasePath(): string
  public abstract repository: AbstractResourceRepository

  createStatusCode = 201

  constructor(parent: Router) {
    this.registerRoutes(parent)
  }

  extraRoutes(router: Router) {}

  registerRoutes(parent: Router) {
    const basePath = this.getBasePath()
    const router = Router({ mergeParams: true })

    // Bind this first since the `/:id` routes are currently a bit to greedy
    this.extraRoutes(router)

    router.get('/', this.get.bind(this))
    router.get('/key=:key', this.getWithKey.bind(this)) // same thing goes for the key routes
    router.get('/:id', this.getWithId.bind(this))

    router.delete('/key=:key', this.deletewithKey.bind(this))
    router.delete('/:id', this.deletewithId.bind(this))

    router.post('/', this.post.bind(this))
    router.post('/key=:key', this.postWithKey.bind(this))
    router.post('/:id', this.postWithId.bind(this))

    parent.use(`/${basePath}`, router)
  }

  get(request: Request, response: Response) {
    const limit = this._parseParam(request.query.limit)
    const offset = this._parseParam(request.query.offset)

    const result = this.repository.query(request.params.projectKey, {
      expand: this._parseParam(request.query.expand),
      where: this._parseParam(request.query.where),
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    })
    return response.status(200).send(result)
  }

  getWithId(request: Request, response: Response) {
    const result = this._expandWithId(request, request.params['id'])
    if (!result) {
      return response.status(404).send()
    }
    console.log(JSON.stringify(result, null, 4))
    return response.status(200).send(result)
  }

  getWithKey(request: Request, response: Response) {
    const result = this.repository.getByKey(
      request.params.projectKey,
      request.params['key'],
      { expand: this._parseParam(request.query.expand) }
    )
    if (!result) return response.status(404).send()
    return response.status(200).send(result)
  }

  deletewithId(request: Request, response: Response) {
    const result = this.repository.delete(
      request.params.projectKey,
      request.params['id'],
      {
        expand: this._parseParam(request.query.expand),
      }
    )
    if (!result) {
      return response.status(404).send('Not found')
    }
    return response.status(200).send(result)
  }

  deletewithKey(request: Request, response: Response) {
    return response.status(500).send('Not implemented')
  }

  post(request: Request, response: Response) {
    const draft = request.body
    const resource = this.repository.create(request.params.projectKey, draft)
    const result = this._expandWithId(request, resource.id)
    return response.status(this.createStatusCode).send(result)
  }

  postWithId(request: Request, response: Response) {
    const updateRequest: Update = request.body
    const resource = this.repository.get(
      request.params.projectKey,
      request.params['id']
    )
    if (!resource) {
      return response.status(404).send('Not found')
    }

    if (resource.version !== updateRequest.version) {
      return response.status(409).send('Concurrent modification')
    }

    const updatedResource = this.repository.processUpdateActions(
      request.params.projectKey,
      resource,
      updateRequest.actions
    )

    const result = this._expandWithId(request, updatedResource.id)
    return response.status(200).send(result)
  }

  postWithKey(request: Request, response: Response) {
    return response.status(500).send('Not implemented')
  }

  protected _expandWithId(request: Request, resourceId: string) {
    const result = this.repository.get(request.params.projectKey, resourceId, {
      expand: this._parseParam(request.query.expand),
    })
    return result
  }

  // No idea what i'm doing
  private _parseParam(
    value: string | ParsedQs | string[] | ParsedQs[] | undefined
  ): string[] | undefined {
    if (Array.isArray(value)) {
      // @ts-ignore
      return value
    } else if (value !== undefined) {
      return [`${value}`]
    }
    return undefined
  }
}
