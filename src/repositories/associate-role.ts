import { AssociateRole } from '@commercetools/platform-sdk'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class AssociateRoleRepository extends AbstractResourceRepository<'associate-role'> {
  getTypeId() {
    return 'associate-role' as const
  }
  create(context: RepositoryContext, draft: any): AssociateRole {
    throw new Error('Method not implemented.')
  }
}
