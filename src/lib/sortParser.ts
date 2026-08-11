export type SortDirection = "asc" | "desc";

export type SortClause = {
	/** Dot-separated field path, already split. */
	path: string[];
	direction: SortDirection;
};

/**
 * Parse commercetools `sort` parameters.
 *
 * The syntax is `field` or `field asc` / `field desc`, and the parameter may be
 * repeated for a secondary sort — which the SDK passes as an array. A missing
 * direction means ascending.
 */
export const parseSortClauses = (
	sort: string | string[] | undefined,
): SortClause[] => {
	if (sort === undefined) {
		return [];
	}

	const clauses = Array.isArray(sort) ? sort : [sort];

	return clauses.flatMap((clause) => {
		const [field, direction] = clause.trim().split(/\s+/);
		if (!field) {
			return [];
		}

		return [
			{
				path: field.split("."),
				direction: direction?.toLowerCase() === "desc" ? "desc" : "asc",
			},
		];
	});
};

const resolvePath = (resource: unknown, path: string[]): unknown => {
	let current = resource;

	for (const segment of path) {
		if (current === null || typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[segment];
	}

	return current;
};

/**
 * Compare two field values.
 *
 * Strings use `<` and `>` rather than `localeCompare`, deliberately: the
 * predicate parser compares with the same operators, so a `where id > "..."`
 * cursor and a `sort id asc` have to agree on the ordering or paging silently
 * skips resources. It also matches the API for the values that get sorted on in
 * practice — ids, keys and ISO timestamps.
 */
const compareValues = (left: unknown, right: unknown): number => {
	// A missing value counts as larger than any present one, and the requested
	// direction then applies — so it sorts last ascending and first descending,
	// the same rule SQL uses. What matters either way is that the order is total
	// and deterministic, or a cursor cannot page through it.
	if (left === undefined || left === null) {
		return right === undefined || right === null ? 0 : 1;
	}
	if (right === undefined || right === null) {
		return -1;
	}

	if (typeof left === "number" && typeof right === "number") {
		return left - right;
	}
	if (typeof left === "boolean" && typeof right === "boolean") {
		return Number(left) - Number(right);
	}

	// Anything else compares as a string, which covers ISO dates correctly since
	// their lexicographic and chronological orders coincide.
	const leftText = String(left);
	const rightText = String(right);
	if (leftText < rightText) {
		return -1;
	}
	if (leftText > rightText) {
		return 1;
	}
	return 0;
};

/**
 * Sort resources by the given clauses.
 *
 * Returns the input unchanged when there is nothing to sort by. The sort is
 * stable, so resources that compare equal keep their existing order and a
 * secondary clause only breaks ties from the first.
 */
export const applySort = <T>(
	resources: T[],
	sort: string | string[] | undefined,
): T[] => {
	const clauses = parseSortClauses(sort);
	if (clauses.length === 0) {
		return resources;
	}

	return [...resources].sort((left, right) => {
		for (const clause of clauses) {
			const result = compareValues(
				resolvePath(left, clause.path),
				resolvePath(right, clause.path),
			);
			if (result !== 0) {
				return clause.direction === "desc" ? -result : result;
			}
		}
		return 0;
	});
};
