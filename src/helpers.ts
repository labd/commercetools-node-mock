import { v4 as uuidv4 } from 'uuid'

export const getBaseResourceProperties = () => {
  return {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    version: 0,
  }
}
