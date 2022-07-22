import { v4 as uuidv4 } from 'uuid'
import { ParsedQs } from 'qs'

export const getBaseResourceProperties = () => {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    version: 0,
  }
}


export const QueryParamsAsArray = (input: string | ParsedQs | string[] | ParsedQs[] | undefined): string[] => {
  if (input == undefined) {
    return []
  }

  if (Array.isArray(input)) {
    return input as string[]
  }
  return [input] as string[]
}
