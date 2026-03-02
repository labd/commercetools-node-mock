import type { FastifyRequest } from "fastify";

export const getBearerToken = (request: FastifyRequest): string | undefined => {
	const authHeader = request.headers.authorization;
	const normalizedAuthHeader = Array.isArray(authHeader)
		? authHeader[0]
		: authHeader;
	const match = normalizedAuthHeader?.match(/^Bearer\s(?<token>[^\s]+)$/);
	if (match) {
		return match.groups?.token;
	}
	return undefined;
};
