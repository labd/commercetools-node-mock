import { getBaseResourceProperties } from '../helpers'
import { getReferenceFromResourceIdentifier } from './helpers'
import {
  StateReference,
  State,
  StateChangeKeyAction,
  StateDraft,
  StateSetDescriptionAction,
  StateSetNameAction,
  StateSetRolesAction,
  StateSetTransitionsAction,
  StateUpdateAction,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from 'types'

export class StateRepository extends AbstractResourceRepository<'state'> {
  getTypeId() {
    return 'state' as const
  }

  create(context: RepositoryContext, draft: StateDraft): State {
    const resource: State = {
      ...getBaseResourceProperties(),
      ...draft,
      builtIn: false,
      initial: draft.initial || false,
      transitions: (draft.transitions || []).map((t) =>
        getReferenceFromResourceIdentifier(t, context.projectKey, this._storage)
      ),
    }

    this.saveNew(context, resource)
    return resource
  }

  actions: Partial<
    Record<
      StateUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<State>,
        action: any
      ) => void
    >
  > = {
    changeKey: (
      context: RepositoryContext,
      resource: Writable<State>,
      { key }: StateChangeKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      context: RepositoryContext,
      resource: Writable<State>,
      { description }: StateSetDescriptionAction
    ) => {
      resource.description = description
    },
    setName: (
      context: RepositoryContext,
      resource: Writable<State>,
      { name }: StateSetNameAction
    ) => {
      resource.name = name
    },
    setRoles: (
      context: RepositoryContext,
      resource: Writable<State>,
      { roles }: StateSetRolesAction
    ) => {
      resource.roles = roles
    },
    setTransitions: (
      context: RepositoryContext,
      resource: Writable<State>,
      { transitions }: StateSetTransitionsAction
    ) => {
      resource.transitions = transitions?.map(
        (resourceId): StateReference => ({
          id: resourceId.id || '',
          typeId: 'state',
        })
      )
    },
  }
}
