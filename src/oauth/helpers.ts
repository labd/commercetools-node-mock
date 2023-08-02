import { Request } from 'express'

export const getBearerToken = (request: Request): string | undefined => {
	const authHeader = request.header('Authorization')
	const match = authHeader?.match(/^Bearer\s(?<token>[^\s]+)$/)
	if (match) {
		return match.groups?.token
	}
	return undefined
}
