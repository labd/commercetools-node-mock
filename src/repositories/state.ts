import { getBaseResourceProperties } from '../helpers'
import { getReferenceFromResourceIdentifier } from './helpers'
import { ReferenceTypeId, State, StateDraft } from '@commercetools/platform-sdk'
import AbstractRepository from './abstract'

export class StateRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'state'
  }

  create(projectKey: string, draft: StateDraft): State {
    const resource: State = {
      ...getBaseResourceProperties(),
      ...draft,
      builtIn: false,
      initial: draft.initial || false,
      transitions: (draft.transitions || []).map(t =>
        getReferenceFromResourceIdentifier(t, projectKey, this._storage)
      ),
    }

    this.save(projectKey, resource)
    return resource
  }

  actions = {}
}
