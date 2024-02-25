export const copyHeaders = (headers: Headers) => {
	const validHeaders = ["accept", "host", "authorization", "content-type"];
	const result: Record<string, string> = {};

	for (const [key, value] of headers.entries()) {
		if (validHeaders.includes(key.toLowerCase())) {
			result[key] = value;
		}
	}

	return result;
};
