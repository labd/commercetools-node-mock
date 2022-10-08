import {
  BaseResource,
  ConcurrentModificationError,
  Project,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions'

export const checkConcurrentModification = (
  currentVersion: number,
  expectedVersion: number,
  identifier: string
) => {
  if (currentVersion === expectedVersion) return
  console.error(`Object ${identifier} has a different version than expected. Expected: ${expectedVersion} - Actual: ${currentVersion}.`)

  throw new CommercetoolsError<ConcurrentModificationError>(
    {
      message: `Object ${identifier} has a different version than expected. Expected: ${expectedVersion} - Actual: ${currentVersion}.`,
      currentVersion: currentVersion,
      code: 'ConcurrentModification',
    },
    409
  )
}
