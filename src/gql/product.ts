import { Product } from '@commercetools/platform-sdk'
import { ProductRepository } from '../repositories/product'
import { ResourceResolver } from './abstract'
import { toAllLocales } from './utils'

export class ProductResolver extends ResourceResolver {
  public repository: ProductRepository

  constructor(repository: ProductRepository) {
    super()
    this.repository = repository
  }

  transformResource(resource: Product) {
    // @ts-ignore
    // TODO: generate types and use gql specific types here
    resource.masterData.current.slugAllLocales = toAllLocales(
      resource.masterData.current.slug
    )
    return resource
  }

  queryResolvers() {
    return {
      product: this.get.bind(this),
      products: this.query.bind(this),
    }
  }
}
