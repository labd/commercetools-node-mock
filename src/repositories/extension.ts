import { Extension, ExtensionDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class ExtensionRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'extension'
  }

  create(projectKey: string, draft: ExtensionDraft): Extension {
    const resource: Extension = {
      ...getBaseResourceProperties(),
      key: draft.key,
      timeoutInMs: draft.timeoutInMs,
      destination: draft.destination,
      triggers: draft.triggers,
    }
    this.save(projectKey, resource)
    return resource
  }
}
