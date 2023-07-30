import type { AttributeGroup } from '@commercetools/platform-sdk'
import { AbstractResourceRepository, type RepositoryContext } from './abstract'

export class AttributeGroupRepository extends AbstractResourceRepository<'attribute-group'> {
  getTypeId() {
    return 'attribute-group' as const
  }
  create(context: RepositoryContext, draft: any): AttributeGroup {
    throw new Error('Method not implemented.')
  }
}
