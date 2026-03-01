/**
 * OpenAPI → Zod schema generator
 *
 * Reads the commercetools OpenAPI spec and generates Zod 4 schemas for
 * resource creation drafts. Generates schemas for all draft types plus
 * their transitive dependencies.
 *
 * Usage:
 *   pnpm generate:schemas
 *
 * Requires the commercetools API reference repo to be checked out at
 *   ../commercetools-api-reference
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SPEC_PATH = resolve(
	PROJECT_ROOT,
	"../commercetools-api-reference/oas/api/openapi.yaml",
);
const OUTPUT_DIR = resolve(PROJECT_ROOT, "src/schemas/generated");

// ---------------------------------------------------------------------------
// Configuration: which draft schemas to generate
// ---------------------------------------------------------------------------
const DRAFT_SCHEMAS = [
	"AssociateRoleDraft",
	"AttributeGroupDraft",
	"BusinessUnitDraft",
	"CartDraft",
	"CartDiscountDraft",
	"CategoryDraft",
	"ChannelDraft",
	"CustomObjectDraft",
	"CustomerDraft",
	"CustomerGroupDraft",
	"DiscountCodeDraft",
	"DiscountGroupDraft",
	"ExtensionDraft",
	"InventoryEntryDraft",
	"MyQuoteRequestDraft",
	"OrderEditDraft",
	"OrderFromCartDraft",
	"PaymentDraft",
	"ProductDraft",
	"ProductDiscountDraft",
	"ProductSelectionDraft",
	"ProductTailoringDraft",
	"ProductTypeDraft",
	"QuoteDraft",
	"QuoteRequestDraft",
	"RecurrencePolicyDraft",
	"RecurringOrderDraft",
	"ReviewDraft",
	"ShippingMethodDraft",
	"ShoppingListDraft",
	"StandalonePriceDraft",
	"StagedQuoteDraft",
	"StateDraft",
	"StoreDraft",
	"SubscriptionDraft",
	"TaxCategoryDraft",
	"TypeDraft",
	"ZoneDraft",
];

// Map draft schema names to output file names
const DRAFT_FILE_MAP: Record<string, string> = {
	AssociateRoleDraft: "associate-role",
	AttributeGroupDraft: "attribute-group",
	BusinessUnitDraft: "business-unit",
	CartDraft: "cart",
	CartDiscountDraft: "cart-discount",
	CategoryDraft: "category",
	ChannelDraft: "channel",
	CustomObjectDraft: "custom-object",
	CustomerDraft: "customer",
	CustomerGroupDraft: "customer-group",
	DiscountCodeDraft: "discount-code",
	DiscountGroupDraft: "discount-group",
	ExtensionDraft: "extension",
	InventoryEntryDraft: "inventory-entry",
	MyQuoteRequestDraft: "my-quote-request",
	OrderEditDraft: "order-edit",
	OrderFromCartDraft: "order-from-cart",
	PaymentDraft: "payment",
	ProductDraft: "product",
	ProductDiscountDraft: "product-discount",
	ProductSelectionDraft: "product-selection",
	ProductTailoringDraft: "product-tailoring",
	ProductTypeDraft: "product-type",
	QuoteDraft: "quote",
	QuoteRequestDraft: "quote-request",
	RecurrencePolicyDraft: "recurrence-policy",
	RecurringOrderDraft: "recurring-order",
	ReviewDraft: "review",
	ShippingMethodDraft: "shipping-method",
	ShoppingListDraft: "shopping-list",
	StandalonePriceDraft: "standalone-price",
	StagedQuoteDraft: "staged-quote",
	StateDraft: "state",
	StoreDraft: "store",
	SubscriptionDraft: "subscription",
	TaxCategoryDraft: "tax-category",
	TypeDraft: "type",
	ZoneDraft: "zone",
};

// ---------------------------------------------------------------------------
// Schema type definitions
// ---------------------------------------------------------------------------
export interface OpenAPISchema {
	type?: string;
	enum?: string[];
	required?: string[];
	properties?: Record<string, OpenAPIProperty>;
	additionalProperties?: OpenAPIProperty | boolean;
	allOf?: OpenAPISchema[];
	$ref?: string;
	discriminator?: {
		propertyName: string;
		mapping?: Record<string, string>;
	};
	items?: OpenAPIProperty;
	format?: string;
}

export interface OpenAPIProperty {
	type?: string;
	$ref?: string;
	items?: OpenAPIProperty;
	format?: string;
	enum?: string[];
	additionalProperties?: OpenAPIProperty | boolean;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
	console.log("Reading OpenAPI spec...");
	const specContent = readFileSync(SPEC_PATH, "utf-8");

	// Parse with lenient options to handle malformed strings in descriptions
	const spec = parseYaml(specContent, {
		uniqueKeys: false,
		strict: false,
		logLevel: "silent",
	});
	const schemas: Record<string, OpenAPISchema> = spec.components.schemas;

	console.log(`Found ${Object.keys(schemas).length} schemas`);

	// Collect all schemas we need (drafts + transitive deps)
	const needed = new Set<string>();
	for (const draftName of DRAFT_SCHEMAS) {
		collectDependencies(schemas, draftName, needed);
	}

	console.log(`Need ${needed.size} schemas total (including dependencies)`);

	// Classify schemas
	const enums: string[] = [];
	const objects: string[] = [];
	const aliases: string[] = [];

	for (const name of needed) {
		const schema = schemas[name];
		if (!schema) {
			console.warn(`  Warning: schema ${name} not found in spec`);
			continue;
		}
		if (schema.enum) {
			enums.push(name);
		} else if (
			schema.type === "string" &&
			!schema.enum &&
			!schema.properties
		) {
			aliases.push(name);
		} else {
			objects.push(name);
		}
	}

	console.log(
		`  Enums: ${enums.length}, Objects: ${objects.length}, Aliases: ${aliases.length}`,
	);

	// Generate common file (enums + aliases + shared objects)
	const commonSchemas = new Set([...enums, ...aliases, ...objects]);
	for (const draftName of DRAFT_SCHEMAS) {
		commonSchemas.delete(draftName);
	}

	mkdirSync(OUTPUT_DIR, { recursive: true });

	// Generate common.ts
	const commonCode = generateCommonFile(schemas, commonSchemas);
	writeFileSync(resolve(OUTPUT_DIR, "common.ts"), commonCode);
	console.log(`Generated common.ts (${commonSchemas.size} schemas)`);

	// Generate per-draft files
	for (const draftName of DRAFT_SCHEMAS) {
		const fileName = DRAFT_FILE_MAP[draftName];
		const code = generateDraftFile(schemas, draftName, commonSchemas);
		writeFileSync(resolve(OUTPUT_DIR, `${fileName}.ts`), code);
		console.log(`Generated ${fileName}.ts`);
	}

	// Generate index.ts
	const indexCode = generateIndexFile();
	writeFileSync(resolve(OUTPUT_DIR, "index.ts"), indexCode);
	console.log("Generated index.ts");

	console.log("Done!");
}

// ---------------------------------------------------------------------------
// Schema classification helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a schema is a Reference type (extends the base Reference schema).
 * Reference types are response-only shapes with an `obj` field that embeds
 * the full resource. For draft validation we only need the input-relevant
 * fields (id, typeId), so we skip the `obj` dependency and generate a
 * minimal schema.
 */
export function isReferenceType(
	name: string,
	schemas: Record<string, OpenAPISchema>,
): boolean {
	const schema = schemas[name];
	if (!schema?.allOf) return false;
	return schema.allOf.some(
		(item) => item.$ref === "#/components/schemas/Reference",
	);
}

/**
 * Checks if a schema is a ResourceIdentifier type (extends the base
 * ResourceIdentifier schema). These are the input shapes used in drafts
 * to identify resources by id/key.
 */
export function isResourceIdentifierType(
	name: string,
	schemas: Record<string, OpenAPISchema>,
): boolean {
	const schema = schemas[name];
	if (!schema?.allOf) return false;
	return schema.allOf.some(
		(item) => item.$ref === "#/components/schemas/ResourceIdentifier",
	);
}

// ---------------------------------------------------------------------------
// Dependency collection
// ---------------------------------------------------------------------------
export function resolveRef(ref: string): string {
	// "#/components/schemas/Foo" -> "Foo"
	return ref.replace("#/components/schemas/", "");
}

export function collectDependencies(
	schemas: Record<string, OpenAPISchema>,
	name: string,
	collected: Set<string>,
) {
	if (collected.has(name)) return;
	collected.add(name);

	const schema = schemas[name];
	if (!schema) return;

	// Reference types (e.g. OrderReference, StateReference) are response-only
	// shapes. They extend the base Reference schema and have an `obj` field
	// that embeds the full resource, creating circular dependencies. For draft
	// validation we only need {id, typeId}, so we skip their dependencies
	// entirely — the generator will produce a minimal input-only schema.
	if (isReferenceType(name, schemas)) return;

	// ResourceIdentifier types (e.g. ZoneResourceIdentifier) are input shapes
	// with only primitive fields (typeId, id, key). We add them but don't need
	// to recurse — their only dependency is ReferenceTypeId (an enum) which
	// we collect explicitly.
	if (isResourceIdentifierType(name, schemas)) {
		collectDependencies(schemas, "ReferenceTypeId", collected);
		return;
	}

	// Base Reference and ResourceIdentifier types are discriminated unions with
	// 30+ variants. We flatten them to their base shape and collect only
	// their direct property dependencies (ReferenceTypeId enum).
	if (name === "Reference" || name === "ResourceIdentifier") {
		collectDependencies(schemas, "ReferenceTypeId", collected);
		return;
	}

	// Check $ref at top level
	if (schema.$ref) {
		collectDependencies(schemas, resolveRef(schema.$ref), collected);
	}

	// Check allOf
	if (schema.allOf) {
		for (const item of schema.allOf) {
			if (item.$ref) {
				collectDependencies(schemas, resolveRef(item.$ref), collected);
			}
			if (item.properties) {
				collectPropertiesDeps(schemas, item.properties, collected);
			}
		}
	}

	// Check properties
	if (schema.properties) {
		collectPropertiesDeps(schemas, schema.properties, collected);
	}

	// For discriminator mappings, only follow them when there's a small
	// number of variants (e.g., GeoJson has 1 variant). For large
	// discriminated unions we flatten to the base object shape.
	if (schema.discriminator?.mapping) {
		const variants = Object.values(schema.discriminator.mapping);
		if (variants.length <= 5) {
			for (const ref of variants) {
				collectDependencies(schemas, resolveRef(ref), collected);
			}
		}
	}

	// Check additionalProperties
	if (
		schema.additionalProperties &&
		typeof schema.additionalProperties === "object"
	) {
		if (schema.additionalProperties.$ref) {
			collectDependencies(
				schemas,
				resolveRef(schema.additionalProperties.$ref),
				collected,
			);
		}
	}
}

export function collectPropertiesDeps(
	schemas: Record<string, OpenAPISchema>,
	properties: Record<string, OpenAPIProperty>,
	collected: Set<string>,
) {
	for (const prop of Object.values(properties)) {
		if (prop.$ref) {
			collectDependencies(schemas, resolveRef(prop.$ref), collected);
		}
		if (prop.items) {
			if (prop.items.$ref) {
				collectDependencies(schemas, resolveRef(prop.items.$ref), collected);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Code generation helpers
// ---------------------------------------------------------------------------
export function schemaToVarName(name: string): string {
	// ZoneDraft -> ZoneDraftSchema
	return `${name}Schema`;
}

export function propertyToZod(
	prop: OpenAPIProperty,
	schemas: Record<string, OpenAPISchema>,
): string {
	if (prop.$ref) {
		const refName = resolveRef(prop.$ref);
		return schemaToVarName(refName);
	}

	if (prop.type === "string") {
		return "z.string()";
	}

	if (prop.type === "integer") {
		return "z.number().int()";
	}

	if (prop.type === "number") {
		return "z.number()";
	}

	if (prop.type === "boolean") {
		return "z.boolean()";
	}

	if (prop.type === "array") {
		if (prop.items) {
			const itemType = propertyToZod(prop.items, schemas);
			return `z.array(${itemType})`;
		}
		return "z.array(z.unknown())";
	}

	if (prop.type === "object") {
		if (
			prop.additionalProperties &&
			typeof prop.additionalProperties === "object"
		) {
			const valType = propertyToZod(
				prop.additionalProperties as OpenAPIProperty,
				schemas,
			);
			return `z.record(z.string(), ${valType})`;
		}
		return "z.record(z.string(), z.unknown())";
	}

	return "z.unknown()";
}

export function generateObjectSchema(
	schemas: Record<string, OpenAPISchema>,
	name: string,
	schema: OpenAPISchema,
): string {
	// Handle allOf (inheritance)
	if (schema.allOf) {
		return generateAllOfSchema(schemas, name, schema);
	}

	// Handle discriminator (generate discriminated union)
	if (schema.discriminator?.mapping) {
		return generateDiscriminatedUnionSchema(schemas, name, schema);
	}

	// Handle additionalProperties (record type)
	if (schema.additionalProperties) {
		return generateRecordSchema(schemas, name, schema);
	}

	// Regular object
	const required = new Set(
		(schema.required || []).filter((r) => !r.startsWith("/")),
	);
	const props = schema.properties || {};

	const lines: string[] = [];
	for (const [propName, propDef] of Object.entries(props)) {
		const zodType = propertyToZod(propDef, schemas);
		const isRequired = required.has(propName);
		if (isRequired) {
			lines.push(`\t${propName}: ${zodType},`);
		} else {
			lines.push(`\t${propName}: ${zodType}.optional(),`);
		}
	}

	return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n});`;
}

export function generateAllOfSchema(
	schemas: Record<string, OpenAPISchema>,
	name: string,
	schema: OpenAPISchema,
): string {
	const isReference = isReferenceType(name, schemas);
	const isResourceIdentifier = isResourceIdentifierType(name, schemas);

	// Reference types (e.g. OrderReference, StateReference) are response-only.
	// For draft validation, generate only the input-relevant fields: {id, typeId}.
	// Skip the `obj` field entirely — it embeds full resources and is never
	// part of draft input.
	if (isReference) {
		return `export const ${schemaToVarName(name)} = z.object({\n\ttypeId: ReferenceTypeIdSchema,\n\tid: z.string(),\n});`;
	}

	// Merge parent + child properties
	const allProps: Record<string, OpenAPIProperty> = {};
	const allRequired = new Set<string>();

	for (const item of schema.allOf!) {
		let resolved = item;
		if (item.$ref) {
			resolved = schemas[resolveRef(item.$ref)] || {};
		}
		if (resolved.properties) {
			Object.assign(allProps, resolved.properties);
		}
		if (resolved.required) {
			for (const r of resolved.required) {
				if (!r.startsWith("/")) {
					allRequired.add(r);
				}
			}
		}
	}

	const lines: string[] = [];
	for (const [propName, propDef] of Object.entries(allProps)) {
		const zodType = propertyToZod(propDef, schemas);
		const isRequired = allRequired.has(propName);
		if (isRequired) {
			lines.push(`\t${propName}: ${zodType},`);
		} else {
			lines.push(`\t${propName}: ${zodType}.optional(),`);
		}
	}

	// ResourceIdentifier subtypes require at least id or key
	if (isResourceIdentifier) {
		return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n}).refine((data) => data.id !== undefined || data.key !== undefined, { message: "Either 'id' or 'key' must be provided" });`;
	}

	return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n});`;
}

export function generateDiscriminatedUnionSchema(
	schemas: Record<string, OpenAPISchema>,
	name: string,
	schema: OpenAPISchema,
): string {
	const disc = schema.discriminator!;
	const mapping = disc.mapping || {};
	const variants = Object.entries(mapping);

	if (variants.length <= 1) {
		// If there's only one variant, just generate the base object
		// and the single variant merged
		const required = new Set(
			(schema.required || []).filter((r) => !r.startsWith("/")),
		);
		const props = schema.properties || {};

		// Merge with the single variant if it exists
		if (variants.length === 1) {
			const [, ref] = variants[0];
			const variantSchema = schemas[resolveRef(ref)];
			if (variantSchema?.allOf) {
				for (const item of variantSchema.allOf) {
					let resolved = item;
					if (item.$ref) {
						resolved = schemas[resolveRef(item.$ref)] || {};
					}
					if (resolved.properties) {
						Object.assign(props, resolved.properties);
					}
					if (resolved.required) {
						for (const r of resolved.required) {
							if (!r.startsWith("/")) {
								required.add(r);
							}
						}
					}
				}
			}
		}

		const lines: string[] = [];
		for (const [propName, propDef] of Object.entries(props)) {
			const zodType = propertyToZod(propDef, schemas);
			const isRequired = required.has(propName);
			if (isRequired) {
				lines.push(`\t${propName}: ${zodType},`);
			} else {
				lines.push(`\t${propName}: ${zodType}.optional(),`);
			}
		}

		return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n});`;
	}

	// Multiple variants: generate flattened base shape
	const required = new Set(
		(schema.required || []).filter((r) => !r.startsWith("/")),
	);

	const props = schema.properties || {};

	const lines: string[] = [];
	for (const [propName, propDef] of Object.entries(props)) {
		const zodType = propertyToZod(propDef, schemas);
		const isRequired = required.has(propName);
		if (isRequired) {
			lines.push(`\t${propName}: ${zodType},`);
		} else {
			lines.push(`\t${propName}: ${zodType}.optional(),`);
		}
	}

	// ResourceIdentifier base type requires at least id or key
	if (name === "ResourceIdentifier") {
		return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n}).refine((data) => data.id !== undefined || data.key !== undefined, { message: "Either 'id' or 'key' must be provided" });`;
	}

	return `export const ${schemaToVarName(name)} = z.object({\n${lines.join("\n")}\n});`;
}

export function generateRecordSchema(
	_schemas: Record<string, OpenAPISchema>,
	name: string,
	schema: OpenAPISchema,
): string {
	// FieldContainer in the OpenAPI spec says additionalProperties: string,
	// but in practice custom field values can be any JSON type (numbers,
	// booleans, arrays, objects). Use z.unknown() for field containers.
	if (name === "FieldContainer") {
		return `export const ${schemaToVarName(name)} = z.record(z.string(), z.unknown());`;
	}

	if (
		typeof schema.additionalProperties === "object" &&
		schema.additionalProperties.type === "string"
	) {
		return `export const ${schemaToVarName(name)} = z.record(z.string(), z.string());`;
	}
	return `export const ${schemaToVarName(name)} = z.record(z.string(), z.unknown());`;
}

export function generateEnumSchema(name: string, schema: OpenAPISchema): string {
	const values = schema.enum!;
	const enumValues = values.map((v) => `"${v}"`);
	return `export const ${schemaToVarName(name)} = z.enum([${enumValues.join(", ")}]);`;
}

export function generateAliasSchema(name: string, _schema: OpenAPISchema): string {
	return `export const ${schemaToVarName(name)} = z.string();`;
}

// ---------------------------------------------------------------------------
// File generation
// ---------------------------------------------------------------------------

/**
 * Topologically sort schemas so that dependencies come before dependents.
 */
export function topoSort(
	names: Set<string>,
	schemas: Record<string, OpenAPISchema>,
): string[] {
	const visited = new Set<string>();
	const result: string[] = [];

	function visit(name: string) {
		if (visited.has(name) || !names.has(name)) return;
		visited.add(name);

		const schema = schemas[name];
		if (!schema) return;

		// Reference types and ResourceIdentifier types only depend on
		// ReferenceTypeId, no need to scan their full schema
		if (
			isReferenceType(name, schemas) ||
			isResourceIdentifierType(name, schemas)
		) {
			visit("ReferenceTypeId");
			result.push(name);
			return;
		}

		// Visit dependencies first
		const deps = new Set<string>();
		collectDirectDeps(schema, deps);
		for (const dep of deps) {
			visit(dep);
		}
		result.push(name);
	}

	for (const name of names) {
		visit(name);
	}
	return result;
}

export function collectDirectDeps(schema: OpenAPISchema, deps: Set<string>) {
	if (schema.$ref) {
		deps.add(resolveRef(schema.$ref));
	}
	if (schema.allOf) {
		for (const item of schema.allOf) {
			if (item.$ref) deps.add(resolveRef(item.$ref));
			if (item.properties) {
				for (const prop of Object.values(item.properties)) {
					if (prop.$ref) deps.add(resolveRef(prop.$ref));
					if (prop.items?.$ref) deps.add(resolveRef(prop.items.$ref));
				}
			}
		}
	}
	if (schema.properties) {
		for (const prop of Object.values(schema.properties)) {
			if (prop.$ref) deps.add(resolveRef(prop.$ref));
			if (prop.items?.$ref) deps.add(resolveRef(prop.items.$ref));
		}
	}
	if (schema.discriminator?.mapping) {
		for (const ref of Object.values(schema.discriminator.mapping)) {
			deps.add(resolveRef(ref));
		}
	}
}

export function generateCommonFile(
	schemas: Record<string, OpenAPISchema>,
	commonNames: Set<string>,
): string {
	const sorted = topoSort(commonNames, schemas);
	const lines: string[] = [
		"// This file is auto-generated by scripts/generate-schemas.ts",
		"// Do not edit manually.",
		"",
		'import { z } from "zod";',
		"",
	];

	for (const name of sorted) {
		const schema = schemas[name];
		if (!schema) continue;

		let code: string;
		if (schema.enum) {
			code = generateEnumSchema(name, schema);
		} else if (
			schema.type === "string" &&
			!schema.enum &&
			!schema.properties
		) {
			code = generateAliasSchema(name, schema);
		} else {
			code = generateObjectSchema(schemas, name, schema);
		}
		lines.push(code);
		lines.push("");
	}

	return lines.join("\n");
}

export function generateDraftFile(
	schemas: Record<string, OpenAPISchema>,
	draftName: string,
	commonNames: Set<string>,
): string {
	const schema = schemas[draftName];
	const lines: string[] = [
		"// This file is auto-generated by scripts/generate-schemas.ts",
		"// Do not edit manually.",
		"",
		'import { z } from "zod";',
	];

	// Collect which common schemas this draft references
	const deps = new Set<string>();
	collectDirectDeps(schema, deps);

	// Also collect transitive deps from allOf if present
	if (schema.allOf) {
		for (const item of schema.allOf) {
			if (item.$ref) {
				const refSchema = schemas[resolveRef(item.$ref)];
				if (refSchema) collectDirectDeps(refSchema, deps);
			}
		}
	}

	const commonImports = [...deps].filter((d) => commonNames.has(d));
	if (commonImports.length > 0) {
		const importNames = commonImports
			.sort()
			.map((n) => schemaToVarName(n))
			.join(", ");
		lines.push(`import { ${importNames} } from "./common.ts";`);
	}

	lines.push("");

	const code = generateObjectSchema(schemas, draftName, schema);
	lines.push(code);
	lines.push("");

	return lines.join("\n");
}

export function generateIndexFile(): string {
	const lines = [
		"// This file is auto-generated by scripts/generate-schemas.ts",
		"// Do not edit manually.",
		"",
		'export * from "./common.ts";',
	];

	for (const draftName of DRAFT_SCHEMAS) {
		const fileName = DRAFT_FILE_MAP[draftName];
		lines.push(`export * from "./${fileName}.ts";`);
	}

	lines.push("");
	return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Run (only when executed directly, not when imported for testing)
// ---------------------------------------------------------------------------
const isDirectExecution =
	process.argv[1] &&
	resolve(process.argv[1]).replace(/\.(ts|js|mjs)$/, "") ===
		resolve(__dirname, "generate-schemas").replace(/\.(ts|js|mjs)$/, "");
if (isDirectExecution) {
	main();
}
