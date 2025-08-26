import type { VariableMap } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { PredicateError, parseQueryExpression } from "./predicateParser";

describe("Predicate filter", () => {
	const exampleObject = {
		stringProperty: "foobar",
		numberProperty: 1234,
		arrayProperty: ["foo", "bar", "nar"],
		notDefined: undefined,
		emptyArrayProperty: [],
		booleanProperty: true,
		nested: {
			numberProperty: 1234,
			objectProperty: {
				stringProperty: "foobar",
				booleanProperty: true,
				"45c652f2-76e8-48fd-ab64-d11ad99d6631": {
					stringProperty: "foobar",
					uuidProperty: "3a57cc78-db08-4cd3-b778-d59b3326c435",
				},
			},
			array: [
				{
					numberProperty: 1234,
					stringProperty: "foo",
					objectProperty: {
						stringProperty: "foo",
						booleanProperty: true,
					},
				},
				{
					numberProperty: 2345,
					stringProperty: "bar",
					objectProperty: {
						stringProperty: "bar",
						booleanProperty: false,
					},
				},
			],
		},
		array: [
			{
				nestedArray: [
					{
						stringProperty: "foo",
						nested: [
							{
								stringProperty: "foo",
							},
						],
					},
					{
						stringProperty: "bar",
						nested: [
							{
								stringProperty: "bar",
							},
						],
					},
				],
			},
			{
				nestedArray: [
					{
						stringProperty: "foo-2",
						nested: [
							{
								stringProperty: "foo-2",
							},
						],
					},
					{
						stringProperty: "bar-2",
						nested: [
							{
								stringProperty: "bar-2",
							},
						],
					},
				],
			},
		],

		// Longitude, latitude
		geoLocation: [5.110230209615395, 52.06969591642097],
	};

	const match = (pattern: string | string[], vars?: VariableMap) => {
		const matchFunc = parseQueryExpression(pattern);
		return matchFunc(exampleObject, vars || {});
	};

	test('stringProperty = "foobar"', async () => {
		expect(match(`stringProperty="foobar"`)).toBeTruthy();
		expect(match(`stringProperty!="foobar"`)).toBeFalsy();

		expect(match("stringProperty=:val", { val: "foobar" })).toBeTruthy();
	});

	test("booleanProperty = true", async () => {
		expect(match("booleanProperty != true")).toBeFalsy();
		expect(match("booleanProperty = true")).toBeTruthy();

		expect(match("booleanProperty=:val", { val: true })).toBeTruthy();
	});

	test('stringProperty matches ignore case "foobar"', async () => {
		expect(match(`stringProperty="FOObar"`)).toBeFalsy();
		expect(match(`stringProperty matches ignore case "FOObar"`)).toBeTruthy();
		expect(
			match("stringProperty matches ignore case :val", { val: "fooBar" }),
		).toBeTruthy();
	});

	test("numberProperty = 1234", async () => {
		expect(match("numberProperty=1234")).toBeTruthy();
		expect(match("numberProperty = 1234")).toBeTruthy();
		expect(match("numberProperty=1230")).toBeFalsy();
		expect(match("numberProperty = 1230")).toBeFalsy();

		expect(match("numberProperty=:val", { val: 1234 })).toBeTruthy();
	});

	test("numberProperty > ...", async () => {
		expect(match("numberProperty > 1233")).toBeTruthy();
		expect(match("numberProperty > 1234")).toBeFalsy();
	});

	test("numberProperty >= ...", async () => {
		expect(match("numberProperty >= 1234")).toBeTruthy();
		expect(match("numberProperty >= 1235")).toBeFalsy();
	});

	test("numberProperty < ...", async () => {
		expect(match("numberProperty < 1235")).toBeTruthy();
		expect(match("numberProperty < 1234")).toBeFalsy();
	});

	test("numberProperty <= ...", async () => {
		expect(match("numberProperty <= 1235")).toBeTruthy();
		expect(match("numberProperty <= 1234")).toBeTruthy();
		expect(match("numberProperty <= 1233")).toBeFalsy();
	});

	test("numberPropery in (...)", async () => {
		expect(match("numberProperty in (1233, 1234, 1235)")).toBeTruthy();
	});

	test("numberPropery in (...) single value", async () => {
		expect(match("numberProperty in (1234)")).toBeTruthy();
	});

	test("in operator works with with and without parentheses", async () => {
		expect(match("numberProperty in :val", { val: 1234 })).toBeTruthy();
		expect(match("numberProperty in :val", { val: 1235 })).toBeFalsy();
		expect(match("numberProperty in :val", { val: [1234] })).toBeTruthy();
		expect(match("numberProperty in :val", { val: [1235] })).toBeFalsy();
	});

	test("arrayProperty contains all (...)", async () => {
		expect(match(`arrayProperty contains all ("foo", "bar")`)).toBeTruthy();
		expect(
			match(`arrayProperty contains all ("foo", "bar", "no!")`),
		).toBeFalsy();
	});

	test("arrayProperty is empty", async () => {
		expect(match("arrayProperty is empty")).toBeFalsy();
		expect(match("arrayProperty is not empty")).toBeTruthy();
		expect(match("emptyArrayProperty is empty")).toBeTruthy();
	});

	test("property is defined", async () => {
		expect(match("notDefined is defined")).toBeFalsy();
		expect(match("notDefined is not defined")).toBeTruthy();

		expect(match("arrayProperty is defined")).toBeTruthy();
		expect(match("arrayProperty is not defined")).toBeFalsy();
	});

	test("arrayProperty contains any (...)", async () => {
		expect(match(`arrayProperty contains any ("NO!")`)).toBeFalsy();
		expect(match(`arrayProperty contains any ("foo", "bar")`)).toBeTruthy();
		expect(
			match(`arrayProperty contains any ("foo", "bar", "no!")`),
		).toBeTruthy();
	});

	test("nestedArray filters on property", async () => {
		expect(match(`nested(array(stringProperty="foo"))`)).toBeTruthy();
		expect(match(`nested(array(stringProperty="bar"))`)).toBeTruthy();
		expect(match(`nested(array(stringProperty="foobar"))`)).toBeFalsy();

		// Different comparison operators
		expect(match("nested(array(numberProperty>=2345))")).toBeTruthy();
		expect(match("nested(array(numberProperty>=2346))")).toBeFalsy();
		expect(match("nested(array(numberProperty>2344))")).toBeTruthy();
		expect(match("nested(array(numberProperty>2345))")).toBeFalsy();
		expect(match("nested(array(numberProperty<=1234))")).toBeTruthy();
		expect(match("nested(array(numberProperty<=1233))")).toBeFalsy();
		expect(match("nested(array(numberProperty<1235))")).toBeTruthy();
		expect(match("nested(array(numberProperty<1234))")).toBeFalsy();

		// One level deeper
		expect(
			match(`nested(array(objectProperty(stringProperty="foo")))`),
		).toBeTruthy();
		expect(
			match(`nested(array(objectProperty(stringProperty="bar")))`),
		).toBeTruthy();
		expect(
			match(`nested(array(objectProperty(stringProperty="foobar")))`),
		).toBeFalsy();
	});

	test("nested array multiple filters on property", async () => {
		expect(
			match(
				`nested(array(stringProperty="foo" and numberProperty=2345 and objectProperty(stringProperty="foo")))`,
			),
		).toBeFalsy();
		expect(
			match(`nested(array(stringProperty="foo" or numberProperty=2345))`),
		).toBeTruthy();
		expect(
			match(
				`nested(array(stringProperty="foo" and numberProperty > 1233 and numberProperty < 1235))`,
			),
		).toBeTruthy();
		expect(
			match(
				`nested(array(stringProperty="foo" and numberProperty >= 1234 and numberProperty <= 1234))`,
			),
		).toBeTruthy();
		expect(
			match(`nested(array(stringProperty="foo" and numberProperty != 1233))`),
		).toBeTruthy();
		expect(
			match(
				`nested(array(stringProperty="foobar" and numberProperty > 1234 and numberProperty < 1237))`,
			),
		).toBeFalsy();
	});

	test("array filters on property", async () => {
		expect(match(`array(nestedArray(stringProperty="foo")))`)).toBeTruthy();
		expect(
			match(`array(nestedArray(nested(stringProperty="foo"))))`),
		).toBeTruthy();
	});

	test("geolocation within circle (...)", async () => {
		expect(
			match(
				"geoLocation within circle(5.121310867198959, 52.09068804569714, 2500)",
			),
		).toBeTruthy();
		expect(
			match(
				"geoLocation within circle(5.121310867198959, 52.09068804569714, 2400)",
			),
		).toBeFalsy();
	});

	test("negate any other conditional expression", async () => {
		expect(match("numberProperty = 1234")).toBeTruthy();
		expect(match("not (numberProperty = 1234)")).toBeFalsy();
		expect(match("not (numberProperty = 1235)")).toBeTruthy();
		expect(match("not (numberProperty = 1235)")).toBeTruthy();

		expect(match("nested(numberProperty=1234))")).toBeTruthy();
		expect(match("nested(not(numberProperty=1230)))")).toBeTruthy();
		expect(match("nested(not(numberProperty=1234)))")).toBeFalsy();
	});

	test("and clause (implicit)", async () => {
		expect(
			match([`stringProperty="foobar"`, "numberProperty=1234"]),
		).toBeTruthy();

		expect(
			match([`stringProperty="foobar"`, "numberProperty=1111"]),
		).toBeFalsy();
	});

	test("and clause (explicit)", async () => {
		expect(match("numberProperty>1233 and numberProperty<1235")).toBeTruthy();
		expect(match("numberProperty>1233 and numberProperty<1234")).toBeFalsy();
	});

	test("or clause", async () => {
		expect(
			match(
				"numberProperty=1231 or numberProperty>54312 or numberProperty=1234",
			),
		).toBeTruthy();
		expect(match("numberProperty=1231 or numberProperty=1234")).toBeTruthy();
		expect(match("numberProperty=1231 or (numberProperty=1234)")).toBeTruthy();
		expect(match("numberProperty=1233 or numberProperty=1235")).toBeFalsy();
	});

	test("or / and clause mixed", async () => {
		expect(
			match(
				"numberProperty=1234 and (numberProperty=1230 or (numberProperty=1234 or numberProperty=1235))",
			),
		).toBeTruthy();
	});
	test("nested attribute access", async () => {
		expect(
			match(`nested(objectProperty(stringProperty="foobar"))`),
		).toBeTruthy();
	});

	test("nested attribute access", async () => {
		expect(
			match("nested(objectProperty(booleanProperty != true))"),
		).toBeFalsy();
		expect(
			match("nested(objectProperty(booleanProperty != false))"),
		).toBeTruthy();
	});

	// TODO: disabled for now, see remark in predicateParser.ts in resolveValue
	// test('lexer confusion', async () => {
	// 	expect(() => match(`orSomething="foobar"`)).toThrow(PredicateError)
	// 	expect(() => match(`orSomething="foobar"`)).toThrow(
	// 		"The field 'orSomething' does not exist."
	// 	)

	// 	expect(() => match(`andSomething="foobar"`)).toThrow(PredicateError)
	// 	expect(() => match(`andSomething="foobar"`)).toThrow(
	// 		"The field 'andSomething' does not exist."
	// 	)
	// })

	test("invalid predicate", async () => {
		expect(() => match("stringProperty=nomatch")).toThrow(PredicateError);
		expect(() => match("stringProperty=nomatch")).toThrow(
			"Invalid input 'n', expected input parameter or primitive value (line 1, column 16)",
		);
		expect(() => match("stringProperty")).toThrow(PredicateError);
	});

	test("uuid as field name", async () => {
		expect(
			match(
				`nested(objectProperty(45c652f2-76e8-48fd-ab64-d11ad99d6631(stringProperty = "foobar")))`,
			),
		).toBeTruthy();

		expect(
			match(
				`nested(objectProperty(3a57cc78-db08-4cd3-b778-d59b3326c435(stringProperty = "foobar")))`,
			),
		).toBeFalsy();
	});

	test("uuid as value", async () => {
		expect(
			match(
				`nested(objectProperty(45c652f2-76e8-48fd-ab64-d11ad99d6631(uuidProperty = "3a57cc78-db08-4cd3-b778-d59b3326c435")))`,
			),
		).toBeTruthy();
		expect(
			match(
				`nested(objectProperty(45c652f2-76e8-48fd-ab64-d11ad99d6631(uuidProperty = "45c652f2-76e8-48fd-ab64-d11ad99d6631")))`,
			),
		).toBeFalsy();
	});

	test("in operator with array values", async () => {
		expect(match(`arrayProperty in ("foo")`)).toBeTruthy();
		expect(match(`arrayProperty in ("bar")`)).toBeTruthy();
		expect(match(`arrayProperty in ("missing")`)).toBeFalsy();
		expect(match(`arrayProperty in ("foo", "bar")`)).toBeTruthy();
		expect(match(`arrayProperty in ("missing", "alsomissing")`)).toBeFalsy();
	});
});

describe("Report parse errors", () => {
	test("unexpect input", () => {
		expect(() => parseQueryExpression("foo=bar")).toThrow(PredicateError);
	});
});
