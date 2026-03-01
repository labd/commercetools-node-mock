import { describe, expect, it } from "vitest";
import type { OpenAPISchema } from "./generate-schemas.ts";
import {
	collectDependencies,
	collectDirectDeps,
	generateAliasSchema,
	generateAllOfSchema,
	generateDiscriminatedUnionSchema,
	generateEnumSchema,
	generateObjectSchema,
	generateRecordSchema,
	isReferenceType,
	isResourceIdentifierType,
	propertyToZod,
	resolveRef,
	schemaToVarName,
	topoSort,
} from "./generate-schemas.ts";

// ---------------------------------------------------------------------------
// resolveRef
// ---------------------------------------------------------------------------
describe("resolveRef", () => {
	it("extracts schema name from $ref", () => {
		expect(resolveRef("#/components/schemas/ZoneDraft")).toBe("ZoneDraft");
	});

	it("handles nested path", () => {
		expect(resolveRef("#/components/schemas/Foo")).toBe("Foo");
	});
});

// ---------------------------------------------------------------------------
// schemaToVarName
// ---------------------------------------------------------------------------
describe("schemaToVarName", () => {
	it("appends Schema suffix", () => {
		expect(schemaToVarName("ZoneDraft")).toBe("ZoneDraftSchema");
	});

	it("works with single word", () => {
		expect(schemaToVarName("Foo")).toBe("FooSchema");
	});
});

// ---------------------------------------------------------------------------
// isReferenceType
// ---------------------------------------------------------------------------
describe("isReferenceType", () => {
	it("returns true for schema extending Reference via allOf", () => {
		const schemas: Record<string, OpenAPISchema> = {
			OrderReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/Order" },
						},
					},
				],
			},
		};
		expect(isReferenceType("OrderReference", schemas)).toBe(true);
	});

	it("returns false for a regular object schema", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneDraft: {
				type: "object",
				properties: { name: { type: "string" } },
			},
		};
		expect(isReferenceType("ZoneDraft", schemas)).toBe(false);
	});

	it("returns false for schema without allOf", () => {
		const schemas: Record<string, OpenAPISchema> = {
			SomeEnum: { type: "string", enum: ["a", "b"] },
		};
		expect(isReferenceType("SomeEnum", schemas)).toBe(false);
	});

	it("returns false for ResourceIdentifier types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneResourceIdentifier: {
				allOf: [
					{ $ref: "#/components/schemas/ResourceIdentifier" },
					{
						properties: {
							typeId: { type: "string", enum: ["zone"] },
						},
					},
				],
			},
		};
		expect(isReferenceType("ZoneResourceIdentifier", schemas)).toBe(false);
	});

	it("returns false for non-existent schema", () => {
		const schemas: Record<string, OpenAPISchema> = {};
		expect(isReferenceType("DoesNotExist", schemas)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// isResourceIdentifierType
// ---------------------------------------------------------------------------
describe("isResourceIdentifierType", () => {
	it("returns true for schema extending ResourceIdentifier via allOf", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneResourceIdentifier: {
				allOf: [
					{ $ref: "#/components/schemas/ResourceIdentifier" },
					{
						properties: {
							typeId: { type: "string", enum: ["zone"] },
						},
					},
				],
			},
		};
		expect(
			isResourceIdentifierType("ZoneResourceIdentifier", schemas),
		).toBe(true);
	});

	it("returns false for Reference types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			OrderReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/Order" },
						},
					},
				],
			},
		};
		expect(isResourceIdentifierType("OrderReference", schemas)).toBe(false);
	});

	it("returns false for regular objects", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneDraft: { type: "object", properties: {} },
		};
		expect(isResourceIdentifierType("ZoneDraft", schemas)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// propertyToZod
// ---------------------------------------------------------------------------
describe("propertyToZod", () => {
	const emptySchemas: Record<string, OpenAPISchema> = {};

	it("generates z.string() for string type", () => {
		expect(propertyToZod({ type: "string" }, emptySchemas)).toBe(
			"z.string()",
		);
	});

	it("generates z.number().int() for integer type", () => {
		expect(propertyToZod({ type: "integer" }, emptySchemas)).toBe(
			"z.number().int()",
		);
	});

	it("generates z.number() for number type", () => {
		expect(propertyToZod({ type: "number" }, emptySchemas)).toBe(
			"z.number()",
		);
	});

	it("generates z.boolean() for boolean type", () => {
		expect(propertyToZod({ type: "boolean" }, emptySchemas)).toBe(
			"z.boolean()",
		);
	});

	it("generates schema ref for $ref", () => {
		expect(
			propertyToZod(
				{ $ref: "#/components/schemas/LocalizedString" },
				emptySchemas,
			),
		).toBe("LocalizedStringSchema");
	});

	it("generates z.array() for array with items", () => {
		expect(
			propertyToZod(
				{ type: "array", items: { type: "string" } },
				emptySchemas,
			),
		).toBe("z.array(z.string())");
	});

	it("generates z.array() with ref items", () => {
		expect(
			propertyToZod(
				{
					type: "array",
					items: { $ref: "#/components/schemas/ZoneLocation" },
				},
				emptySchemas,
			),
		).toBe("z.array(ZoneLocationSchema)");
	});

	it("generates z.array(z.unknown()) for array without items", () => {
		expect(propertyToZod({ type: "array" }, emptySchemas)).toBe(
			"z.array(z.unknown())",
		);
	});

	it("generates z.record() for object with additionalProperties", () => {
		expect(
			propertyToZod(
				{
					type: "object",
					additionalProperties: { type: "string" },
				},
				emptySchemas,
			),
		).toBe("z.record(z.string(), z.string())");
	});

	it("generates z.record(z.string(), z.unknown()) for plain object", () => {
		expect(propertyToZod({ type: "object" }, emptySchemas)).toBe(
			"z.record(z.string(), z.unknown())",
		);
	});

	it("generates z.unknown() for unrecognized types", () => {
		expect(propertyToZod({}, emptySchemas)).toBe("z.unknown()");
	});
});

// ---------------------------------------------------------------------------
// collectDependencies
// ---------------------------------------------------------------------------
describe("collectDependencies", () => {
	it("collects simple property refs", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneDraft: {
				type: "object",
				properties: {
					name: { type: "string" },
					locations: {
						type: "array",
						items: { $ref: "#/components/schemas/ZoneLocation" },
					},
				},
			},
			ZoneLocation: {
				type: "object",
				properties: {
					country: { type: "string" },
				},
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "ZoneDraft", collected);

		expect(collected).toContain("ZoneDraft");
		expect(collected).toContain("ZoneLocation");
	});

	it("does not recurse into Reference types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			SomeDraft: {
				type: "object",
				properties: {
					ref: { $ref: "#/components/schemas/OrderReference" },
				},
			},
			OrderReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/Order" },
						},
					},
				],
			},
			Reference: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
				},
				discriminator: {
					propertyName: "typeId",
					mapping: {
						order: "#/components/schemas/OrderReference",
					},
				},
			},
			ReferenceTypeId: {
				type: "string",
				enum: ["order"],
			},
			Order: {
				type: "object",
				properties: {
					id: { type: "string" },
					deeply: { $ref: "#/components/schemas/DeeplyNested" },
				},
			},
			DeeplyNested: {
				type: "object",
				properties: { value: { type: "string" } },
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "SomeDraft", collected);

		expect(collected).toContain("SomeDraft");
		expect(collected).toContain("OrderReference");
		// Should NOT follow into Order/DeeplyNested via the obj field
		expect(collected).not.toContain("Order");
		expect(collected).not.toContain("DeeplyNested");
	});

	it("collects ReferenceTypeId for ResourceIdentifier types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			SomeDraft: {
				type: "object",
				properties: {
					zone: {
						$ref: "#/components/schemas/ZoneResourceIdentifier",
					},
				},
			},
			ZoneResourceIdentifier: {
				allOf: [
					{ $ref: "#/components/schemas/ResourceIdentifier" },
					{
						properties: {
							typeId: { type: "string", enum: ["zone"] },
						},
					},
				],
			},
			ResourceIdentifier: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
					key: { type: "string" },
				},
			},
			ReferenceTypeId: {
				type: "string",
				enum: ["zone"],
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "SomeDraft", collected);

		expect(collected).toContain("ZoneResourceIdentifier");
		expect(collected).toContain("ReferenceTypeId");
	});

	it("does not duplicate when circular deps exist", () => {
		const schemas: Record<string, OpenAPISchema> = {
			A: {
				type: "object",
				properties: {
					b: { $ref: "#/components/schemas/B" },
				},
			},
			B: {
				type: "object",
				properties: {
					a: { $ref: "#/components/schemas/A" },
				},
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "A", collected);

		expect(collected).toContain("A");
		expect(collected).toContain("B");
		expect(collected.size).toBe(2);
	});

	it("follows allOf refs and collects their property deps", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ChildDraft: {
				allOf: [
					{ $ref: "#/components/schemas/ParentDraft" },
					{
						properties: {
							extra: {
								$ref: "#/components/schemas/ExtraType",
							},
						},
					},
				],
			},
			ParentDraft: {
				type: "object",
				properties: {
					name: { type: "string" },
					parent_dep: {
						$ref: "#/components/schemas/ParentDep",
					},
				},
			},
			ExtraType: {
				type: "object",
				properties: { value: { type: "string" } },
			},
			ParentDep: {
				type: "object",
				properties: { id: { type: "string" } },
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "ChildDraft", collected);

		expect(collected).toContain("ChildDraft");
		expect(collected).toContain("ParentDraft");
		expect(collected).toContain("ExtraType");
		expect(collected).toContain("ParentDep");
	});

	it("follows small discriminator mappings (<=5 variants)", () => {
		const schemas: Record<string, OpenAPISchema> = {
			GeoJson: {
				type: "object",
				properties: {
					type: { type: "string" },
				},
				discriminator: {
					propertyName: "type",
					mapping: {
						Point: "#/components/schemas/GeoJsonPoint",
					},
				},
			},
			GeoJsonPoint: {
				allOf: [
					{ $ref: "#/components/schemas/GeoJson" },
					{
						properties: {
							coordinates: {
								type: "array",
								items: { type: "number" },
							},
						},
					},
				],
			},
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "GeoJson", collected);

		expect(collected).toContain("GeoJson");
		expect(collected).toContain("GeoJsonPoint");
	});

	it("skips large discriminator mappings (>5 variants)", () => {
		const mapping: Record<string, string> = {};
		const schemas: Record<string, OpenAPISchema> = {};
		for (let i = 0; i < 10; i++) {
			const name = `Variant${i}`;
			mapping[name] = `#/components/schemas/${name}`;
			schemas[name] = {
				type: "object",
				properties: { value: { type: "string" } },
			};
		}
		schemas.BigUnion = {
			type: "object",
			properties: { type: { type: "string" } },
			discriminator: { propertyName: "type", mapping },
		};

		const collected = new Set<string>();
		collectDependencies(schemas, "BigUnion", collected);

		expect(collected).toContain("BigUnion");
		// Should not have collected the variants
		expect(collected).not.toContain("Variant0");
		expect(collected.size).toBe(1);
	});

	it("handles Reference and ResourceIdentifier base types by collecting only ReferenceTypeId", () => {
		const schemas: Record<string, OpenAPISchema> = {
			Reference: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
				},
			},
			ResourceIdentifier: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
					key: { type: "string" },
				},
			},
			ReferenceTypeId: {
				type: "string",
				enum: ["zone", "channel"],
			},
		};

		const refCollected = new Set<string>();
		collectDependencies(schemas, "Reference", refCollected);
		expect(refCollected).toContain("Reference");
		expect(refCollected).toContain("ReferenceTypeId");
		expect(refCollected.size).toBe(2);

		const riCollected = new Set<string>();
		collectDependencies(schemas, "ResourceIdentifier", riCollected);
		expect(riCollected).toContain("ResourceIdentifier");
		expect(riCollected).toContain("ReferenceTypeId");
		expect(riCollected.size).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// collectDirectDeps
// ---------------------------------------------------------------------------
describe("collectDirectDeps", () => {
	it("collects $ref at top level", () => {
		const deps = new Set<string>();
		collectDirectDeps({ $ref: "#/components/schemas/Foo" }, deps);
		expect(deps).toContain("Foo");
	});

	it("collects property refs", () => {
		const deps = new Set<string>();
		collectDirectDeps(
			{
				properties: {
					a: { $ref: "#/components/schemas/TypeA" },
					b: { type: "string" },
				},
			},
			deps,
		);
		expect(deps).toContain("TypeA");
		expect(deps.size).toBe(1);
	});

	it("collects array item refs", () => {
		const deps = new Set<string>();
		collectDirectDeps(
			{
				properties: {
					items: {
						type: "array",
						items: { $ref: "#/components/schemas/ItemType" },
					},
				},
			},
			deps,
		);
		expect(deps).toContain("ItemType");
	});

	it("collects allOf refs and their property refs", () => {
		const deps = new Set<string>();
		collectDirectDeps(
			{
				allOf: [
					{ $ref: "#/components/schemas/Parent" },
					{
						properties: {
							child: { $ref: "#/components/schemas/ChildType" },
						},
					},
				],
			},
			deps,
		);
		expect(deps).toContain("Parent");
		expect(deps).toContain("ChildType");
	});

	it("collects discriminator mapping refs", () => {
		const deps = new Set<string>();
		collectDirectDeps(
			{
				discriminator: {
					propertyName: "type",
					mapping: {
						a: "#/components/schemas/VariantA",
						b: "#/components/schemas/VariantB",
					},
				},
			},
			deps,
		);
		expect(deps).toContain("VariantA");
		expect(deps).toContain("VariantB");
	});
});

// ---------------------------------------------------------------------------
// generateEnumSchema
// ---------------------------------------------------------------------------
describe("generateEnumSchema", () => {
	it("generates z.enum with all values", () => {
		const result = generateEnumSchema("ReferenceTypeId", {
			type: "string",
			enum: ["zone", "channel", "cart"],
		});
		expect(result).toBe(
			'export const ReferenceTypeIdSchema = z.enum(["zone", "channel", "cart"]);',
		);
	});
});

// ---------------------------------------------------------------------------
// generateAliasSchema
// ---------------------------------------------------------------------------
describe("generateAliasSchema", () => {
	it("generates z.string() alias", () => {
		const result = generateAliasSchema("CountryCode", {
			type: "string",
		});
		expect(result).toBe("export const CountryCodeSchema = z.string();");
	});
});

// ---------------------------------------------------------------------------
// generateRecordSchema
// ---------------------------------------------------------------------------
describe("generateRecordSchema", () => {
	it("generates z.record(z.string(), z.unknown()) for FieldContainer", () => {
		const result = generateRecordSchema(
			{},
			"FieldContainer",
			{ additionalProperties: { type: "string" } },
		);
		expect(result).toBe(
			"export const FieldContainerSchema = z.record(z.string(), z.unknown());",
		);
	});

	it("generates z.record(z.string(), z.string()) for string-valued records", () => {
		const result = generateRecordSchema(
			{},
			"LocalizedString",
			{ additionalProperties: { type: "string" } },
		);
		expect(result).toBe(
			"export const LocalizedStringSchema = z.record(z.string(), z.string());",
		);
	});

	it("generates z.record(z.string(), z.unknown()) for non-string records", () => {
		const result = generateRecordSchema(
			{},
			"SomeRecord",
			{ additionalProperties: true },
		);
		expect(result).toBe(
			"export const SomeRecordSchema = z.record(z.string(), z.unknown());",
		);
	});
});

// ---------------------------------------------------------------------------
// generateObjectSchema
// ---------------------------------------------------------------------------
describe("generateObjectSchema", () => {
	it("generates z.object with required and optional fields", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneDraft: {
				type: "object",
				required: ["name"],
				properties: {
					name: { type: "string" },
					description: { type: "string" },
				},
			},
		};

		const result = generateObjectSchema(schemas, "ZoneDraft", schemas.ZoneDraft);
		expect(result).toContain("export const ZoneDraftSchema = z.object({");
		expect(result).toContain("name: z.string(),");
		expect(result).toContain("description: z.string().optional(),");
	});

	it("handles schema with no required fields", () => {
		const schemas: Record<string, OpenAPISchema> = {
			Foo: {
				type: "object",
				properties: {
					a: { type: "string" },
					b: { type: "number" },
				},
			},
		};

		const result = generateObjectSchema(schemas, "Foo", schemas.Foo);
		expect(result).toContain("a: z.string().optional(),");
		expect(result).toContain("b: z.number().optional(),");
	});

	it("delegates to allOf handler for allOf schemas", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ReferenceTypeId: { type: "string", enum: ["zone"] },
			OrderReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/Order" },
						},
					},
				],
			},
			Reference: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
				},
			},
		};

		const result = generateObjectSchema(
			schemas,
			"OrderReference",
			schemas.OrderReference,
		);
		// Should generate minimal {typeId, id} for reference types
		expect(result).toContain("typeId: ReferenceTypeIdSchema,");
		expect(result).toContain("id: z.string(),");
		expect(result).not.toContain("obj:");
	});

	it("delegates to discriminator handler", () => {
		const schemas: Record<string, OpenAPISchema> = {
			MyUnion: {
				type: "object",
				required: ["type"],
				properties: {
					type: { type: "string" },
				},
				discriminator: {
					propertyName: "type",
					mapping: {
						a: "#/components/schemas/VariantA",
						b: "#/components/schemas/VariantB",
						c: "#/components/schemas/VariantC",
						d: "#/components/schemas/VariantD",
						e: "#/components/schemas/VariantE",
						f: "#/components/schemas/VariantF",
					},
				},
			},
		};

		const result = generateObjectSchema(schemas, "MyUnion", schemas.MyUnion);
		// With >5 variants, should flatten to base shape
		expect(result).toContain("export const MyUnionSchema = z.object({");
		expect(result).toContain("type: z.string(),");
	});

	it("delegates to record handler for additionalProperties", () => {
		const schemas: Record<string, OpenAPISchema> = {
			MyRecord: {
				type: "object",
				additionalProperties: { type: "string" },
			},
		};

		const result = generateObjectSchema(
			schemas,
			"MyRecord",
			schemas.MyRecord,
		);
		expect(result).toBe(
			"export const MyRecordSchema = z.record(z.string(), z.string());",
		);
	});

	it("filters out required fields starting with /", () => {
		const schemas: Record<string, OpenAPISchema> = {
			WeirdSchema: {
				type: "object",
				required: ["name", "/invalid-field"],
				properties: {
					name: { type: "string" },
				},
			},
		};

		const result = generateObjectSchema(
			schemas,
			"WeirdSchema",
			schemas.WeirdSchema,
		);
		expect(result).toContain("name: z.string(),");
	});
});

// ---------------------------------------------------------------------------
// generateAllOfSchema
// ---------------------------------------------------------------------------
describe("generateAllOfSchema", () => {
	it("generates minimal {typeId, id} for Reference types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ReferenceTypeId: { type: "string", enum: ["state"] },
			StateReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/State" },
						},
					},
				],
			},
			Reference: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
				},
			},
		};

		const result = generateAllOfSchema(
			schemas,
			"StateReference",
			schemas.StateReference,
		);
		expect(result).toContain("typeId: ReferenceTypeIdSchema,");
		expect(result).toContain("id: z.string(),");
		expect(result).not.toContain("obj:");
	});

	it("merges parent and child properties for regular allOf", () => {
		const schemas: Record<string, OpenAPISchema> = {
			Parent: {
				type: "object",
				required: ["name"],
				properties: {
					name: { type: "string" },
				},
			},
			Child: {
				allOf: [
					{ $ref: "#/components/schemas/Parent" },
					{
						required: ["extra"],
						properties: {
							extra: { type: "integer" },
						},
					},
				],
			},
		};

		const result = generateAllOfSchema(schemas, "Child", schemas.Child);
		expect(result).toContain("name: z.string(),");
		expect(result).toContain("extra: z.number().int(),");
		// 'name' should be required (from parent)
		expect(result).not.toContain("name: z.string().optional()");
		// 'extra' should be required (from child allOf entry)
		expect(result).not.toContain("extra: z.number().int().optional()");
	});

	it("generates .refine() for ResourceIdentifier types", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ReferenceTypeId: { type: "string", enum: ["zone"] },
			ResourceIdentifier: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
					key: { type: "string" },
				},
			},
			ZoneResourceIdentifier: {
				allOf: [
					{ $ref: "#/components/schemas/ResourceIdentifier" },
					{
						required: ["typeId"],
						properties: {
							typeId: { type: "string", enum: ["zone"] },
						},
					},
				],
			},
		};

		const result = generateAllOfSchema(
			schemas,
			"ZoneResourceIdentifier",
			schemas.ZoneResourceIdentifier,
		);
		expect(result).toContain(".refine(");
		expect(result).toContain("id");
		expect(result).toContain("key");
	});
});

// ---------------------------------------------------------------------------
// generateDiscriminatedUnionSchema
// ---------------------------------------------------------------------------
describe("generateDiscriminatedUnionSchema", () => {
	it("merges single variant into base schema", () => {
		const schemas: Record<string, OpenAPISchema> = {
			GeoJson: {
				type: "object",
				required: ["type"],
				properties: {
					type: { type: "string" },
				},
				discriminator: {
					propertyName: "type",
					mapping: {
						Point: "#/components/schemas/GeoJsonPoint",
					},
				},
			},
			GeoJsonPoint: {
				allOf: [
					{ $ref: "#/components/schemas/GeoJson" },
					{
						required: ["coordinates"],
						properties: {
							coordinates: {
								type: "array",
								items: { type: "number" },
							},
						},
					},
				],
			},
		};

		const result = generateDiscriminatedUnionSchema(
			schemas,
			"GeoJson",
			schemas.GeoJson,
		);
		expect(result).toContain("type: z.string(),");
		expect(result).toContain("coordinates: z.array(z.number()),");
	});

	it("flattens to base shape with multiple variants", () => {
		const schemas: Record<string, OpenAPISchema> = {
			MyUnion: {
				type: "object",
				required: ["type"],
				properties: {
					type: { type: "string" },
					value: { type: "string" },
				},
				discriminator: {
					propertyName: "type",
					mapping: {
						a: "#/components/schemas/VariantA",
						b: "#/components/schemas/VariantB",
					},
				},
			},
		};

		const result = generateDiscriminatedUnionSchema(
			schemas,
			"MyUnion",
			schemas.MyUnion,
		);
		expect(result).toContain("type: z.string(),");
		expect(result).toContain("value: z.string().optional(),");
	});

	it("adds .refine() for ResourceIdentifier base type", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ResourceIdentifier: {
				type: "object",
				required: ["typeId"],
				properties: {
					typeId: { type: "string" },
					id: { type: "string" },
					key: { type: "string" },
				},
				discriminator: {
					propertyName: "typeId",
					mapping: {
						zone: "#/components/schemas/ZoneResourceIdentifier",
						channel:
							"#/components/schemas/ChannelResourceIdentifier",
					},
				},
			},
		};

		const result = generateDiscriminatedUnionSchema(
			schemas,
			"ResourceIdentifier",
			schemas.ResourceIdentifier,
		);
		expect(result).toContain(".refine(");
		expect(result).toContain("id");
		expect(result).toContain("key");
	});
});

// ---------------------------------------------------------------------------
// topoSort
// ---------------------------------------------------------------------------
describe("topoSort", () => {
	it("sorts dependencies before dependents", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ZoneDraft: {
				type: "object",
				properties: {
					locations: {
						type: "array",
						items: { $ref: "#/components/schemas/ZoneLocation" },
					},
				},
			},
			ZoneLocation: {
				type: "object",
				properties: {
					country: { $ref: "#/components/schemas/CountryCode" },
				},
			},
			CountryCode: {
				type: "string",
			},
		};

		const names = new Set(["ZoneDraft", "ZoneLocation", "CountryCode"]);
		const sorted = topoSort(names, schemas);

		const idxCountry = sorted.indexOf("CountryCode");
		const idxLocation = sorted.indexOf("ZoneLocation");
		const idxDraft = sorted.indexOf("ZoneDraft");

		expect(idxCountry).toBeLessThan(idxLocation);
		expect(idxLocation).toBeLessThan(idxDraft);
	});

	it("handles Reference types by only depending on ReferenceTypeId", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ReferenceTypeId: { type: "string", enum: ["order"] },
			OrderReference: {
				allOf: [
					{ $ref: "#/components/schemas/Reference" },
					{
						properties: {
							obj: { $ref: "#/components/schemas/Order" },
						},
					},
				],
			},
			Reference: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
					id: { type: "string" },
				},
			},
		};

		const names = new Set([
			"ReferenceTypeId",
			"OrderReference",
		]);
		const sorted = topoSort(names, schemas);

		expect(sorted.indexOf("ReferenceTypeId")).toBeLessThan(
			sorted.indexOf("OrderReference"),
		);
	});

	it("handles ResourceIdentifier types by only depending on ReferenceTypeId", () => {
		const schemas: Record<string, OpenAPISchema> = {
			ReferenceTypeId: { type: "string", enum: ["zone"] },
			ZoneResourceIdentifier: {
				allOf: [
					{ $ref: "#/components/schemas/ResourceIdentifier" },
					{
						properties: {
							typeId: { type: "string", enum: ["zone"] },
						},
					},
				],
			},
			ResourceIdentifier: {
				properties: {
					typeId: { $ref: "#/components/schemas/ReferenceTypeId" },
				},
			},
		};

		const names = new Set([
			"ReferenceTypeId",
			"ZoneResourceIdentifier",
		]);
		const sorted = topoSort(names, schemas);

		expect(sorted.indexOf("ReferenceTypeId")).toBeLessThan(
			sorted.indexOf("ZoneResourceIdentifier"),
		);
	});

	it("skips names not in the provided set", () => {
		const schemas: Record<string, OpenAPISchema> = {
			A: {
				type: "object",
				properties: {
					b: { $ref: "#/components/schemas/B" },
				},
			},
			B: {
				type: "object",
				properties: { value: { type: "string" } },
			},
		};

		// Only include A, not B
		const names = new Set(["A"]);
		const sorted = topoSort(names, schemas);

		expect(sorted).toEqual(["A"]);
		expect(sorted).not.toContain("B");
	});
});
