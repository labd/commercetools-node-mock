import { ReferenceTypeId, Zone, ZoneDraft } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class ZoneRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'zone'
  }

  create(projectKey: string, draft: ZoneDraft): Zone {
    const resource: Zone = {
      ...getBaseResourceProperties(),
      key: draft.key,
      locations: draft.locations,
      name: draft.name,
      description: draft.description,
    }
    this.save(projectKey, resource)
    return resource
  }
}
