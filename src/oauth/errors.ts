export interface InvalidClientError {
	readonly code: "invalid_client";
	readonly message: string;
}

export interface UnsupportedGrantType {
	readonly code: "unsupported_grant_type";
	readonly message: string;
}
