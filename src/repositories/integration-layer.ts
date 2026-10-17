import type {
	AttributeDefinition,
	FieldDefinition,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import type {
	ConfigEntry,
	ConfigEntryPatch,
	FieldVisibilityRow,
	IntegrationLayerState,
	SourceCoordinate,
} from "#src/integration-layer-types.ts";
import type { AbstractStorage } from "../storage/index.ts";

/** Hosts commercetools never lets an extension call. */
const DENIED_HOSTS = ["*.commercetools.app"];

/**
 * The Commerce Integration Layer's management API for a Project: its session
 * defaults, checkout rules, hidden fields, IdP login, extension config and
 * allowlist. Every Project is taken as enrolled. The state is held in memory,
 * whatever the storage.
 */
export class IntegrationLayerRepository {
	private storage: AbstractStorage;

	private projects = new Map<string, IntegrationLayerState>();

	constructor(config: Config) {
		this.storage = config.storage;
	}

	clear() {
		this.projects.clear();
	}

	state(projectKey: string): IntegrationLayerState {
		let state = this.projects.get(projectKey);
		if (!state) {
			state = {
				settings: {},
				hiddenFields: [],
				config: new Map(),
				allow: [],
				version: 1,
			};
			this.projects.set(projectKey, state);
		}
		return state;
	}

	/**
	 * The languages, countries and currencies a session can start with: the
	 * Project's. Left out when the Project has none, so a session default is
	 * not checked against an empty list.
	 */
	async presentment(projectKey: string) {
		const project = await this.storage.getProject(projectKey);
		if (
			project.languages.length === 0 &&
			project.countries.length === 0 &&
			project.currencies.length === 0
		) {
			return undefined;
		}
		return {
			languages: project.languages,
			countries: project.countries,
			currencies: project.currencies,
		};
	}

	/**
	 * Every field that can be hidden, from the Project's Custom Types and
	 * Product Types, marked active when a rule hides it, and each rule for a
	 * field that does not exist, with the reason it is not in force.
	 */
	async visibility(projectKey: string): Promise<FieldVisibilityRow[]> {
		const state = this.state(projectKey);
		const fields: { coordinate: SourceCoordinate; fieldType: string }[] = [];
		for (const type of await this.storage.all(projectKey, "type")) {
			for (const field of type.fieldDefinitions as FieldDefinition[]) {
				fields.push({
					coordinate: {
						space: "customField",
						typeKey: type.key,
						fieldName: field.name,
					},
					fieldType: field.type.name,
				});
			}
		}
		for (const productType of await this.storage.all(
			projectKey,
			"product-type",
		)) {
			if (!productType.key) continue;
			for (const attribute of (productType.attributes ??
				[]) as AttributeDefinition[]) {
				fields.push({
					coordinate: {
						space: "attribute",
						typeKey: productType.key,
						fieldName: attribute.name,
					},
					fieldType: attribute.type.name,
				});
			}
		}

		const hidden = (c: SourceCoordinate) =>
			state.hiddenFields.some((h) => sameCoordinate(h, c));
		const rows: FieldVisibilityRow[] = fields.map((f) => ({
			...f,
			active: hidden(f.coordinate),
		}));
		for (const rule of state.hiddenFields) {
			if (!fields.some((f) => sameCoordinate(f.coordinate, rule))) {
				rows.push({ coordinate: rule, active: false, reason: "noSuchField" });
			}
		}
		return rows;
	}

	configEntries(projectKey: string): ConfigEntry[] {
		return [...this.state(projectKey).config.entries()].map(([key, entry]) =>
			entry.secret
				? { key, value: null, secret: true }
				: { key, value: entry.value, secret: false },
		);
	}

	patchConfig(projectKey: string, entries: ConfigEntryPatch[]) {
		const state = this.state(projectKey);
		for (const entry of entries) {
			if (entry.value === null || entry.value === undefined) {
				state.config.delete(entry.key);
				continue;
			}
			state.config.set(entry.key, {
				value: String(entry.value),
				secret: entry.secret ?? false,
			});
		}
		state.version++;
	}

	deny(): string[] {
		return DENIED_HOSTS;
	}
}

const sameCoordinate = (a: SourceCoordinate, b: SourceCoordinate) =>
	a.space === b.space && a.typeKey === b.typeKey && a.fieldName === b.fieldName;
