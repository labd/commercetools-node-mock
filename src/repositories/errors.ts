import type { ConcurrentModificationError } from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";

export const checkConcurrentModification = (
	currentVersion: number,
	expectedVersion: number,
	identifier: string,
) => {
	if (currentVersion === expectedVersion) return;
	throw new CommercetoolsError<ConcurrentModificationError>(
		{
			message: `Object ${identifier} has a different version than expected. Expected: ${expectedVersion} - Actual: ${currentVersion}.`,
			currentVersion: currentVersion,
			code: "ConcurrentModification",
		},
		409,
	);
};
