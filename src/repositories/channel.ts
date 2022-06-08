import {
  Channel,
  ChannelDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class ChannelRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'channel'
  }

  create(context: RepositoryContext, draft: ChannelDraft): Channel {
    const resource: Channel = {
      ...getBaseResourceProperties(),
      key: draft.key,
      roles: draft.roles || [],
    }
    this.save(context, resource)
    return resource
  }
}
