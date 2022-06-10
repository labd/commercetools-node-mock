import {
  BaseResource,
  ConcurrentModificationError,
  Project,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions'

export const checkConcurrentModification = (
  resource: BaseResource | Project,
  expectedVersion: number
) => {
  if (resource.version === expectedVersion) return

  const identifier = (resource as BaseResource).id
    ? (resource as BaseResource).id
    : (resource as Project).key

  throw new CommercetoolsError<ConcurrentModificationError>(
    {
      message: `Object ${identifier} has a different version than expected. Expected: ${expectedVersion} - Actual: ${resource.version}.`,
      currentVersion: resource.version,
      code: 'ConcurrentModification',
    },
    409
  )
}
