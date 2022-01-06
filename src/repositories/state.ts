import { getBaseResourceProperties } from '../helpers'
import { getReferenceFromResourceIdentifier } from './helpers'
import {
  ReferenceTypeId,
  State,
  StateChangeKeyAction,
  StateDraft,
  StateSetDescriptionAction,
  StateSetNameAction,
  StateUpdateAction,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository } from './abstract'
import { Writable } from 'types'

export class StateRepository extends AbstractResourceRepository {
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

  actions: Partial<
    Record<
      StateUpdateAction['action'],
      (projectKey: string, resource: Writable<State>, action: any) => void
    >
  > = {
    changeKey: (
      projectKey: string,
      resource: Writable<State>,
      { key }: StateChangeKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      projectKey: string,
      resource: Writable<State>,
      { description }: StateSetDescriptionAction
    ) => {
      resource.description = description
    },
    setName: (
      projectKey: string,
      resource: Writable<State>,
      { name }: StateSetNameAction
    ) => {
      resource.name = name
    },
  }
}
