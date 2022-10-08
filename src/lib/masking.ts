import { cloneObject } from "../helpers"

export const maskSecretValue = <T>(resource: T, path: string): T => {
  const parts = path.split('.')
  const clone = cloneObject(resource) as any
  let val = clone

  const target = parts.pop()
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    val = val[part]

    if (val === undefined) {
      return resource
    }
  }

  if (val && target && val[target]) {
    val[target] = '****'
  }
  return clone
}
