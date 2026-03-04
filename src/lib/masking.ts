export const maskSecretValue = <T>(resource: T, path: string): T => {
	const parts = path.split(".");
	// Callers are expected to pass objects that are safe to mutate
	// (e.g. clones from storage retrieval).
	let val = resource as any;

	const target = parts.pop();
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		val = val[part];

		if (val === undefined) {
			return resource;
		}
	}

	if (val && target && val[target]) {
		val[target] = "****";
	}
	return resource;
};
