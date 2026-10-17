/**
 * Types of the Commerce Integration Layer's management API. commercetools does
 * not publish a spec for it yet; these follow the one the commercetools Go SDK
 * generates its `integrationlayer` package from
 * (specs/integration-layer/api.raml), written from the commercetools CLI and
 * the CIL documentation. Replace them with generated types once
 * commercetools-api-reference carries the management API.
 */

export type ProjectSettings = {
	label: string;
	language: string;
	currency: string;
	country: string;
};

export type CheckoutRule = {
	countries?: string[];
	stores?: string[];
	applicationKey: string;
	mode: "COMPLETE" | "PAYMENT_ONLY";
};

export type CheckoutConfig = {
	rules: CheckoutRule[];
};

export type SourceCoordinate = {
	space: "customField" | "attribute";
	typeKey: string;
	fieldName: string;
};

export type FieldVisibilityRow = {
	coordinate: SourceCoordinate;
	fieldType?: string;
	active: boolean;
	reason?: string;
};

export type IdpClaimMapping = {
	externalId: string;
	email: string;
	firstName: string;
	lastName: string;
	phone: string;
};

export type IdpConfig = {
	issuer: string;
	tokenEndpoint: string;
	revocationEndpoint: string;
	jwksUri: string;
	authorizationEndpoint?: string;
	clientId: string;
	redirectUri: string;
	claims: IdpClaimMapping;
	matchStrategy: "externalId" | "email";
	hasClientSecret: boolean;
};

export type IdpConfigInput = Omit<IdpConfig, "hasClientSecret"> & {
	clientSecret?: string;
};

export type ConfigEntry = {
	key: string;
	value?: string | null;
	secret: boolean;
};

export type ConfigEntryPatch = {
	key: string;
	value: string | null;
	secret?: boolean;
};

/** What the Integration Layer holds for one Project. */
export type IntegrationLayerState = {
	settings: Partial<ProjectSettings>;
	checkout?: CheckoutConfig;
	hiddenFields: SourceCoordinate[];
	idp?: IdpConfig;
	idpClientSecret?: string;
	config: Map<string, { value: string; secret: boolean }>;
	allow: string[];
	version: number;
};
