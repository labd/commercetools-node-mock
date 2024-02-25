const shownWarnings = new Set();

export const warnDeprecation = (msg: string) => {
	if (!shownWarnings.has(msg)) {
		console.warn(msg);
		shownWarnings.add(msg);
	}
};
