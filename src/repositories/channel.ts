import {
  Channel,
  ChannelDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class ChannelRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'channel'
  }

  create(projectKey: string, draft: ChannelDraft): Channel {
    const resource: Channel = {
      ...getBaseResourceProperties(),
      key: draft.key,
      roles: draft.roles || [],
    }
    this.save(projectKey, resource)
    return resource
  }
}
