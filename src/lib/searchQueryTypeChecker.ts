import type {
	SearchAndExpression,
	SearchAnyValue,
	SearchDateRangeExpression,
	SearchDateTimeRangeExpression,
	SearchExactExpression,
	SearchExistsExpression,
	SearchFilterExpression,
	SearchFullTextExpression,
	SearchFullTextPrefixExpression,
	SearchLongRangeExpression,
	SearchNotExpression,
	SearchNumberRangeExpression,
	SearchOrExpression,
	SearchPrefixExpression,
	SearchTimeRangeExpression,
	SearchWildCardExpression,
	_SearchQuery,
	_SearchQueryExpression,
} from "@commercetools/platform-sdk";

export const validateSearchQuery = (query: _SearchQuery): void => {
	if (isSearchAndExpression(query)) {
		query.and.forEach((expr) => validateSearchQuery(expr));
	} else if (isSearchOrExpression(query)) {
		query.or.forEach((expr) => validateSearchQuery(expr));
	} else if (isSearchNotExpression(query)) {
		validateSearchQuery(query.not);
	} else if (
		isSearchFilterExpression(query) ||
		isSearchRangeExpression(query) ||
		isSearchExactExpression(query) ||
		isSearchExistsExpression(query) ||
		isSearchFullTextExpression(query) ||
		isSearchFullTextPrefixExpression(query) ||
		isSearchPrefixExpression(query) ||
		isSearchWildCardExpression(query) ||
		isSearchAnyValue(query)
	) {
		return;
	} else {
		throw new Error("Unsupported search query expression");
	}
};

// Type guards
export const isSearchAndExpression = (
	expr: _SearchQuery,
): expr is SearchAndExpression =>
	(expr as SearchAndExpression).and !== undefined;

export const isSearchOrExpression = (
	expr: _SearchQuery,
): expr is SearchOrExpression => (expr as SearchOrExpression).or !== undefined;

export type SearchRangeExpression =
	| SearchDateRangeExpression
	| SearchDateTimeRangeExpression
	| SearchLongRangeExpression
	| SearchNumberRangeExpression
	| SearchTimeRangeExpression;

// Type guard for SearchNotExpression
export const isSearchNotExpression = (
	expr: _SearchQueryExpression,
): expr is SearchNotExpression =>
	(expr as SearchNotExpression).not !== undefined;

// Type guard for SearchFilterExpression
export const isSearchFilterExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFilterExpression =>
	(expr as SearchFilterExpression).filter !== undefined;

// Type guard for SearchDateRangeExpression
export const isSearchRangeExpression = (
	expr: _SearchQueryExpression,
): expr is SearchRangeExpression =>
	(expr as SearchRangeExpression).range !== undefined;

// Type guard for SearchExactExpression
export const isSearchExactExpression = (
	expr: _SearchQueryExpression,
): expr is SearchExactExpression =>
	(expr as SearchExactExpression).exact !== undefined;

// Type guard for SearchExistsExpression
export const isSearchExistsExpression = (
	expr: _SearchQueryExpression,
): expr is SearchExistsExpression =>
	(expr as SearchExistsExpression).exists !== undefined;

// Type guard for SearchFullTextExpression
export const isSearchFullTextExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFullTextExpression =>
	(expr as SearchFullTextExpression).fullText !== undefined;

// Type guard for SearchFullTextPrefixExpression
export const isSearchFullTextPrefixExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFullTextPrefixExpression =>
	(expr as SearchFullTextPrefixExpression).fullTextPrefix !== undefined;

// Type guard for SearchPrefixExpression
export const isSearchPrefixExpression = (
	expr: _SearchQueryExpression,
): expr is SearchPrefixExpression =>
	(expr as SearchPrefixExpression).prefix !== undefined;

// Type guard for SearchWildCardExpression
export const isSearchWildCardExpression = (
	expr: _SearchQueryExpression,
): expr is SearchWildCardExpression =>
	(expr as SearchWildCardExpression).wildcard !== undefined;

// Type guard for SearchAnyValue
export const isSearchAnyValue = (
	expr: _SearchQueryExpression,
): expr is SearchAnyValue => (expr as SearchAnyValue).value !== undefined;
