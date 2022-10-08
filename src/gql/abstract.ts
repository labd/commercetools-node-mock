import {
  BaseResource,
  InvalidInputError,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions'
import { AbstractResourceRepository } from '../repositories/abstract'
import { GraphQLContext } from './context'

export abstract class ResourceResolver {
  protected abstract repository: AbstractResourceRepository

  transformResource(resource: BaseResource) {
    return resource
  }

  get(parent: unknown, args: { key: string }, ctx: GraphQLContext) {
    let result: BaseResource | null = null

    if (args.key) {
      result = this.repository.getByKey(ctx.repositoryContext, args.key)
    } else {
      throw new CommercetoolsError<InvalidInputError>(
        {
          code: 'InvalidInput',
          message:
            'Exactly one of following arguments required: `id`, `key`, `sku`, `variantKey`.',
        },
        400
      )
    }
    if (result) {
      return this.transformResource(result)
    }
    return result
  }

  query(parent: unknown, args: { key: string }, ctx: GraphQLContext) {
    try {
      const items = this.repository.query(ctx.repositoryContext, {})
      return items.results.map(this.transformResource)
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}
