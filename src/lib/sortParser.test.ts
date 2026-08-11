import { describe, expect, test } from "vitest";
import { applySort, parseSortClauses } from "./sortParser.ts";

describe("parseSortClauses", () => {
	test("defaults to ascending", () => {
		expect(parseSortClauses("id")).toEqual([
			{ path: ["id"], direction: "asc" },
		]);
	});

	test("reads an explicit direction", () => {
		expect(parseSortClauses("createdAt desc")).toEqual([
			{ path: ["createdAt"], direction: "desc" },
		]);
		expect(parseSortClauses("createdAt DESC")).toEqual([
			{ path: ["createdAt"], direction: "desc" },
		]);
	});

	test("splits a dot path", () => {
		expect(parseSortClauses("name.en-GB asc")).toEqual([
			{ path: ["name", "en-GB"], direction: "asc" },
		]);
	});

	test("takes several clauses, as a repeated query parameter", () => {
		expect(parseSortClauses(["key asc", "createdAt desc"])).toEqual([
			{ path: ["key"], direction: "asc" },
			{ path: ["createdAt"], direction: "desc" },
		]);
	});

	test("tolerates extra whitespace and empty clauses", () => {
		expect(parseSortClauses("  id   asc  ")).toEqual([
			{ path: ["id"], direction: "asc" },
		]);
		expect(parseSortClauses(["", "id"])).toEqual([
			{ path: ["id"], direction: "asc" },
		]);
	});

	test("returns nothing when unset", () => {
		expect(parseSortClauses(undefined)).toEqual([]);
	});
});

describe("applySort", () => {
	const resources = [
		{ id: "c", version: 2, key: "x", name: { "en-GB": "Beta" } },
		{ id: "a", version: 10, key: "x", name: { "en-GB": "alpha" } },
		{ id: "b", version: 1, name: {} },
	];

	const ids = (input: { id: string }[]) => input.map((entry) => entry.id);

	test("sorts ascending by default", () => {
		expect(ids(applySort(resources, "id"))).toEqual(["a", "b", "c"]);
	});

	test("sorts descending", () => {
		expect(ids(applySort(resources, "id desc"))).toEqual(["c", "b", "a"]);
	});

	test("compares numbers numerically, not as strings", () => {
		// "10" < "2" as strings, which is the bug this guards against.
		expect(ids(applySort(resources, "version asc"))).toEqual(["b", "c", "a"]);
	});

	test("follows a dot path", () => {
		expect(ids(applySort(resources, "name.en-GB asc"))).toEqual([
			"c",
			"a",
			"b",
		]);
	});

	test("treats a missing value as the largest, so direction applies to it", () => {
		// Last ascending, first descending — SQL's rule. The property that matters
		// for a cursor is only that the order is total and deterministic.
		expect(ids(applySort(resources, "name.en-GB asc")).at(-1)).toBe("b");
		expect(ids(applySort(resources, "name.en-GB desc")).at(0)).toBe("b");
	});

	test("breaks ties with a second clause", () => {
		expect(ids(applySort(resources, ["key asc", "id desc"]))).toEqual([
			"c",
			"a",
			"b",
		]);
	});

	test("is stable, so equal resources keep their order", () => {
		const equal = [
			{ id: "1", key: "k" },
			{ id: "2", key: "k" },
		];

		expect(ids(applySort(equal, "key asc"))).toEqual(["1", "2"]);
	});

	test("does not mutate the input", () => {
		const input = [{ id: "b" }, { id: "a" }];
		applySort(input, "id asc");

		expect(ids(input)).toEqual(["b", "a"]);
	});

	test("returns the input unchanged when there is no sort", () => {
		expect(ids(applySort(resources, undefined))).toEqual(["c", "a", "b"]);
	});

	test("orders strings the same way the predicate parser compares them", () => {
		// The invariant that makes cursor paging work: `sort id asc` must agree with
		// `where id > "..."`. Both use plain `<`/`>` on the string, so a
		// locale-aware comparison here would silently skip resources during paging.
		const mixed = [{ id: "b" }, { id: "B" }, { id: "a" }, { id: "A" }];
		const sorted = ids(applySort(mixed, "id asc"));

		expect(sorted).toEqual(["A", "B", "a", "b"]);
		for (let index = 1; index < sorted.length; index++) {
			expect(sorted[index] > sorted[index - 1]).toBe(true);
		}
	});

	test("sorts ISO timestamps chronologically", () => {
		const dated = [
			{ id: "late", createdAt: "2026-02-01T00:00:00.000Z" },
			{ id: "early", createdAt: "2026-01-15T23:59:59.000Z" },
		];

		expect(ids(applySort(dated, "createdAt asc"))).toEqual(["early", "late"]);
	});
});
