export const copyHeaders = (headers: Record<string, string>) => {
	const validHeaders = ['accept', 'host', 'authorization']
	const result: Record<string, string> = {}

	Object.entries(headers).forEach(([key, value]) => {
		if (validHeaders.includes(key.toLowerCase())) {
			result[key] = value
		}
	})

	return result
}
