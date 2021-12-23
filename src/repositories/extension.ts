import { Extension, ExtensionDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class ExtensionRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'extension'
  }

  create(projectKey: string, draft: ExtensionDraft): Extension {
    const resource: Extension = {
      ...getBaseResourceProperties(),
      destination: draft.destination,
      triggers: draft.triggers,
    }
    this.save(projectKey, resource)
    return resource
  }
}
