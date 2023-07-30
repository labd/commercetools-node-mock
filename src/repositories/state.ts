import type {
  State,
  StateChangeInitialAction,
  StateChangeKeyAction,
  StateDraft,
  StateReference,
  StateSetDescriptionAction,
  StateSetNameAction,
  StateSetRolesAction,
  StateSetTransitionsAction,
  StateUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import type { Writable } from '../types'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { getReferenceFromResourceIdentifier } from './helpers'

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
    changeInitial: (
      context: RepositoryContext,
      resource: Writable<State>,
      {initial }: StateChangeInitialAction
    ) => {
      resource.initial = initial
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
