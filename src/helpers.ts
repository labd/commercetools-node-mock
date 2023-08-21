import { ParsedQs } from 'qs'
import { v4 as uuidv4 } from 'uuid'

export const getBaseResourceProperties = () => ({
	id: uuidv4(),
	createdAt: new Date().toISOString(),
	lastModifiedAt: new Date().toISOString(),
	version: 0,
})

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

export const queryParamsArray = (
	input: string | ParsedQs | string[] | ParsedQs[] | undefined
): string[] | undefined => {
	if (input == undefined) {
		return undefined
	}

	const values: string[] = Array.isArray(input) ? input as string[] : [input] as string[]
	if (values.length < 1) {
		return undefined
	}
	return values
}

export const queryParamsValue = (
	value: string | ParsedQs | string[] | ParsedQs[] | undefined
): string | undefined => {
	const values = queryParamsArray(value)
	if (values && values.length > 0) {
		return values[0]
	}
	return undefined
}

export const cloneObject = <T>(o: T): T => JSON.parse(JSON.stringify(o))
