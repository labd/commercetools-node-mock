import { v4 as uuidv4 } from 'uuid'
import { ParsedQs } from 'qs'
import { Price } from '@commercetools/platform-sdk'

export const getBaseResourceProperties = () => {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    version: 0,
  }
}

/**
 * Do a nested lookup by using a path. For example `foo.bar.value` will
 * return obj['foo']['bar']['value']
 */
export const nestedLookup = (obj: any, path: string): any => {
  if (!path || path === '') {
    return obj
  }

  const parts = path.split('.')
  let val = obj

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (val == undefined) {
      return undefined
    }

    val = val[part]
  }

  return val
}

export const QueryParamsAsArray = (
  input: string | ParsedQs | string[] | ParsedQs[] | undefined
): string[] => {
  if (input == undefined) {
    return []
  }

  if (Array.isArray(input)) {
    return input as string[]
  }
  return [input] as string[]
}

export const cloneObject = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o))
}
