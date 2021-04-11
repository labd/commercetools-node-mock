import {
  BaseResource,
  ConcurrentModificationError,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions'

export const checkConcurrentModification = (
  resource: BaseResource,
  expectedVersion: number
) => {
  if (resource.version == expectedVersion) return

  throw new CommercetoolsError<ConcurrentModificationError>(
    {
      message: `Object ${resource.id} has a different version than expected. Expected: ${expectedVersion} - Actual: ${resource.version}.`,
      currentVersion: resource.version,
      code: 'ConcurrentModification',
    },
    409
  )
}
