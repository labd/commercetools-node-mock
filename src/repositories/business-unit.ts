import type { BusinessUnit } from '@commercetools/platform-sdk'
import { AbstractResourceRepository, type RepositoryContext } from './abstract.js'

export class BusinessUnitRepository extends AbstractResourceRepository<'business-unit'> {
  getTypeId() {
    return 'business-unit' as const
  }
  create(context: RepositoryContext, draft: any): BusinessUnit {
    throw new Error('Method not implemented.')
  }
}
