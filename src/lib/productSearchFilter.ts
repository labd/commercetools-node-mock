import type {
	ProductProjection,
	ProductVariant,
	SearchAndExpression,
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
	_SearchQueryExpressionValue,
} from "@commercetools/platform-sdk";
import { nestedLookup } from "~src/helpers";
import type { Writable } from "../types";
import { getVariants } from "./projectionSearchFilter";

type ProductSearchFilterFunc = (
	p: Writable<ProductProjection>,
	markMatchingVariants: boolean,
) => boolean;

// @TODO: fieldType checking, better text/wildcard search, result boosting
export const parseSearchQuery = (
	searchQuery: _SearchQuery,
): ProductSearchFilterFunc => {
	if (isSearchAndExpression(searchQuery)) {
		return (obj, markMatchingVariant) =>
			searchQuery.and.every((expr) => {
				const filterFunc = parseSearchQuery(expr);

				return filterFunc(obj, markMatchingVariant);
			});
	}

	if (isSearchOrExpression(searchQuery)) {
		return (obj, markMatchingVariant) =>
			searchQuery.or.some((expr) => {
				const filterFunc = parseSearchQuery(expr);

				return filterFunc(obj, markMatchingVariant);
			});
	}

	if (isSearchNotExpression(searchQuery)) {
		return (obj, markMatchingVariant) =>
			!parseSearchQuery(searchQuery.not)(obj, markMatchingVariant);
	}

	if (isSearchFilterExpression(searchQuery)) {
		// Matching resources of a query are checked for their relevancy to the search.
		// The relevancy is expressed by an internal score.
		// All expressions except filter expressions contribute to that score.
		// All sub-expressions of a filter are implicitly connected with an and expression.
		// NOTE: for now just implementing it like a AND expression
		return (obj, markMatchingVariant) =>
			searchQuery.filter.every((expr) => {
				const filterFunc = parseSearchQuery(expr);

				return filterFunc(obj, markMatchingVariant);
			});
	}

	if (isSearchRangeExpression(searchQuery)) {
		const generateRangeMatchFunc = (value: any) => {
			const rangeFilters = [];

			if (searchQuery.range.gte) {
				rangeFilters.push(value >= searchQuery.range.gte);
			}

			if (searchQuery.range.gt) {
				rangeFilters.push(value > searchQuery.range.gt);
			}

			if (searchQuery.range.lte) {
				rangeFilters.push(value <= searchQuery.range.lte);
			}

			if (searchQuery.range.lt) {
				rangeFilters.push(value < searchQuery.range.lt);
			}

			return rangeFilters.every((filter) => filter);
		};

		return generateFieldMatchFunc(generateRangeMatchFunc, searchQuery.range);
	}

	if (isSearchExactExpression(searchQuery)) {
		return generateFieldMatchFunc(
			(value: any) => value === searchQuery.exact.value,
			searchQuery.exact,
		);
	}

	if (isSearchExistsExpression(searchQuery)) {
		return generateFieldMatchFunc((value: any) => !!value, searchQuery.exists);
	}

	if (isSearchFullTextExpression(searchQuery)) {
		// TODO: Implement better fulltext search, doesn't support all uses cases, see: https://docs.commercetools.com/api/search-query-language#fulltext
		// Potential options to replace with:
		// - https://github.com/bevacqua/fuzzysearch
		// - With scoring (& therefore boosting): https://github.com/farzher/fuzzysort
		return generateFieldMatchFunc(
			(value: any) => value.includes(searchQuery.fullText.value),
			searchQuery.fullText,
		);
	}

	if (isSearchFullTextPrefixExpression(searchQuery)) {
		// TODO: Implement better fulltext prefix search
		return generateFieldMatchFunc(
			(value: any) => value.startsWith(searchQuery.fullTextPrefix.value),
			searchQuery.fullTextPrefix,
		);
	}

	if (isSearchPrefixExpression(searchQuery)) {
		return generateFieldMatchFunc(
			(value: any) => value.startsWith(searchQuery.prefix.value),
			searchQuery.prefix,
		);
	}

	if (isSearchWildCardExpression(searchQuery)) {
		// TODO: Implement better (actual) wildcard search
		const generateWildcardMatchFunc = (value: any) => {
			const wildCardValues = searchQuery.wildcard.value
				.split("*")
				.filter((v: string) => !!v);

			if (searchQuery.wildcard.caseInsensitive) {
				return wildCardValues.every((wildCardValue: string) =>
					value.toLowerCase().includes(wildCardValue.toLowerCase()),
				);
			}

			return wildCardValues.every((wildCardValue: string) =>
				value.includes(wildCardValue),
			);
		};

		return generateFieldMatchFunc(
			generateWildcardMatchFunc,
			searchQuery.wildcard,
		);
	}

	throw new Error("Unsupported search query expression");
};

const generateFieldMatchFunc = (
	matchFunc: (value: any) => boolean,
	searchQuery: _SearchQueryExpressionValue,
) => {
	const generateMatchFunc = (
		obj: ProductProjection,
		markMatchingVariants: boolean,
	) => {
		if (searchQuery.field.startsWith("variants.")) {
			const variantField = searchQuery.field.substring(
				searchQuery.field.indexOf(".") + 1,
			);

			const variants = getVariants(obj) as Writable<ProductVariant>[];
			for (const variant of variants) {
				const value = resolveFieldValue(variant, {
					...searchQuery,
					field: variantField,
				});

				if (matchFunc(value)) {
					if (markMatchingVariants) {
						for (const v of variants) {
							v.isMatchingVariant = false;
						}
						variant.isMatchingVariant = true;
					}

					return true;
				}
			}

			return false;
		}

		return matchFunc(resolveFieldValue(obj, searchQuery));
	};

	return generateMatchFunc;
};

const resolveFieldValue = (
	obj: any,
	searchQuery: _SearchQueryExpressionValue,
) => {
	if (searchQuery.field === undefined) {
		throw new Error("Missing field path in query expression");
	}

	let fieldPath = searchQuery.field;
	const language = "language" in searchQuery ? searchQuery.language : undefined;

	if (fieldPath.startsWith("variants.")) {
		fieldPath = fieldPath.substring(fieldPath.indexOf(".") + 1);
	}

	if (fieldPath.startsWith("attributes.")) {
		const [, attrName, ...rest] = fieldPath.split(".");
		if (!obj.attributes) {
			return undefined;
			0;
		}

		for (const attr of obj.attributes) {
			if (attr.name === attrName) {
				return nestedLookupByLanguage(attr.value, rest.join("."), language);
			}
		}
	}

	if (fieldPath === "prices.currentCentAmount") {
		return obj.prices && obj.prices.length > 0
			? obj.prices[0].value.centAmount
			: undefined;
	}

	return nestedLookupByLanguage(obj, fieldPath, language);
};

const nestedLookupByLanguage = (
	obj: any,
	path: string,
	language?: string,
): any => {
	const value = nestedLookup(obj, path);

	if (language && value && typeof value === "object") {
		// Due to Commercetools supporting "en", but also "en-US" as language, we need to find the best match
		const matchingLanguageKey = Object.keys(value).find((key) =>
			key.toLowerCase().startsWith(language.toLowerCase()),
		);

		return matchingLanguageKey ? value[matchingLanguageKey] : undefined;
	}

	return value;
};

// type guards
const isSearchAndExpression = (
	expr: _SearchQuery,
): expr is SearchAndExpression =>
	(expr as SearchAndExpression).and !== undefined;

const isSearchOrExpression = (expr: _SearchQuery): expr is SearchOrExpression =>
	(expr as SearchOrExpression).or !== undefined;

type SearchRangeExpression =
	| SearchDateRangeExpression
	| SearchDateTimeRangeExpression
	| SearchLongRangeExpression
	| SearchNumberRangeExpression
	| SearchTimeRangeExpression;

// Type guard for SearchNotExpression
const isSearchNotExpression = (
	expr: _SearchQueryExpression,
): expr is SearchNotExpression =>
	(expr as SearchNotExpression).not !== undefined;

// Type guard for SearchFilterExpression
const isSearchFilterExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFilterExpression =>
	(expr as SearchFilterExpression).filter !== undefined;

// Type guard for SearchDateRangeExpression
const isSearchRangeExpression = (
	expr: _SearchQueryExpression,
): expr is SearchRangeExpression =>
	(expr as SearchRangeExpression).range !== undefined;

// Type guard for SearchExactExpression
const isSearchExactExpression = (
	expr: _SearchQueryExpression,
): expr is SearchExactExpression =>
	(expr as SearchExactExpression).exact !== undefined;

// Type guard for SearchExistsExpression
const isSearchExistsExpression = (
	expr: _SearchQueryExpression,
): expr is SearchExistsExpression =>
	(expr as SearchExistsExpression).exists !== undefined;

// Type guard for SearchFullTextExpression
const isSearchFullTextExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFullTextExpression =>
	(expr as SearchFullTextExpression).fullText !== undefined;

// Type guard for SearchFullTextPrefixExpression
const isSearchFullTextPrefixExpression = (
	expr: _SearchQueryExpression,
): expr is SearchFullTextPrefixExpression =>
	(expr as SearchFullTextPrefixExpression).fullTextPrefix !== undefined;

// Type guard for SearchPrefixExpression
const isSearchPrefixExpression = (
	expr: _SearchQueryExpression,
): expr is SearchPrefixExpression =>
	(expr as SearchPrefixExpression).prefix !== undefined;

// Type guard for SearchWildCardExpression
const isSearchWildCardExpression = (
	expr: _SearchQueryExpression,
): expr is SearchWildCardExpression =>
	(expr as SearchWildCardExpression).wildcard !== undefined;
