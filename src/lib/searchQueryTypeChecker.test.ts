import type {
	_SearchQuery,
	_SearchQueryExpression,
	SearchAndExpression,
	SearchOrExpression,
} from "@commercetools/platform-sdk";
import { describe, expect, it } from "vitest";
import {
	isSearchAndExpression,
	isSearchAnyValue,
	isSearchExactExpression,
	isSearchExistsExpression,
	isSearchFilterExpression,
	isSearchFullTextExpression,
	isSearchFullTextPrefixExpression,
	isSearchNotExpression,
	isSearchOrExpression,
	isSearchPrefixExpression,
	isSearchRangeExpression,
	isSearchWildCardExpression,
	validateSearchQuery,
} from "./searchQueryTypeChecker.ts";

describe("searchQueryTypeChecker", () => {
	it("should validate SearchAndExpression", () => {
		const query: SearchAndExpression = { and: [] };
		expect(isSearchAndExpression(query)).toBe(true);
	});

	it("should validate SearchOrExpression", () => {
		const query: SearchOrExpression = { or: [] };
		expect(isSearchOrExpression(query)).toBe(true);
	});

	it("should validate SearchNotExpression", () => {
		const query: _SearchQueryExpression = { not: {} };
		expect(isSearchNotExpression(query)).toBe(true);
	});

	it("should validate SearchFilterExpression", () => {
		const query: _SearchQueryExpression = { filter: [] };
		expect(isSearchFilterExpression(query)).toBe(true);
	});

	it("should validate SearchRangeExpression", () => {
		const query: _SearchQueryExpression = { range: {} };
		expect(isSearchRangeExpression(query)).toBe(true);
	});

	it("should validate SearchExactExpression", () => {
		const query: _SearchQueryExpression = { exact: "some-exact" };
		expect(isSearchExactExpression(query)).toBe(true);
	});

	it("should validate SearchExistsExpression", () => {
		const query: _SearchQueryExpression = { exists: true };
		expect(isSearchExistsExpression(query)).toBe(true);
	});

	it("should validate SearchFullTextExpression", () => {
		const query: _SearchQueryExpression = { fullText: "some-text" };
		expect(isSearchFullTextExpression(query)).toBe(true);
	});

	it("should validate SearchFullTextPrefixExpression", () => {
		const query: _SearchQueryExpression = { fullTextPrefix: "some-prefix" };
		expect(isSearchFullTextPrefixExpression(query)).toBe(true);
	});

	it("should validate SearchPrefixExpression", () => {
		const query: _SearchQueryExpression = { prefix: "some-prefix" };
		expect(isSearchPrefixExpression(query)).toBe(true);
	});

	it("should validate SearchWildCardExpression", () => {
		const query: _SearchQueryExpression = { wildcard: "some-wildcard" };
		expect(isSearchWildCardExpression(query)).toBe(true);
	});

	it("should validate SearchAnyValue", () => {
		const query: _SearchQueryExpression = { value: "some-value" };
		expect(isSearchAnyValue(query)).toBe(true);
	});

	it("should throw an error for unsupported query", () => {
		const query = { unsupported: "unsupported" } as _SearchQuery;
		expect(() => validateSearchQuery(query)).toThrow(
			"Unsupported search query expression",
		);
	});

	it("should not throw an error for supported query", () => {
		const query: SearchAndExpression = { and: [] };
		expect(() => validateSearchQuery(query)).not.toThrow();
	});
});
