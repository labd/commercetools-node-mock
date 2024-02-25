import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";

type Token = {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
	scope: string;
	refresh_token?: string;
};

export class OAuth2Store {
	tokens: Token[] = [];

	validate = true;

	constructor(validate = true) {
		this.validate = validate;
	}

	addToken(token: Token) {
		this.tokens.push(token);
	}

	getClientToken(clientId: string, clientSecret: string, scope?: string) {
		const token: Token = {
			access_token: randomBytes(16).toString("base64"),
			token_type: "Bearer",
			expires_in: 172800,
			scope: scope || "todo",
			refresh_token: `my-project-${randomBytes(16).toString("base64")}`,
		};
		this.addToken(token);
		return token;
	}

	getAnonymousToken(
		projectKey: string,
		anonymousId: string | undefined,
		scope: string,
	) {
		if (!anonymousId) {
			anonymousId = uuidv4();
		}
		const token: Token = {
			access_token: randomBytes(16).toString("base64"),
			token_type: "Bearer",
			expires_in: 172800,
			scope: scope
				? `${scope} anonymous_id:${anonymousId}`
				: `anonymous_id:${anonymousId}`,
			refresh_token: `${projectKey}:${randomBytes(16).toString("base64")}`,
		};
		this.addToken(token);
		return token;
	}

	getCustomerToken(projectKey: string, customerId: string, scope: string) {
		const token: Token = {
			access_token: randomBytes(16).toString("base64"),
			token_type: "Bearer",
			expires_in: 172800,
			scope: scope
				? `${scope} customer_id:${customerId}`
				: `customer_id:${customerId}`,
			refresh_token: `${projectKey}:${randomBytes(16).toString("base64")}`,
		};
		this.addToken(token);
		return token;
	}

	refreshToken(clientId: string, clientSecret: string, refreshToken: string) {
		const existing = this.tokens.find((t) => t.refresh_token === refreshToken);
		if (!existing) {
			return undefined;
		}
		const token: Token = {
			...existing,
			access_token: randomBytes(16).toString("base64"),
		};
		this.addToken(token);

		// We don't want to return the refresh_token again
		return {
			access_token: token.access_token,
			token_type: token.token_type,
			expires_in: token.expires_in,
			scope: token.scope,
		};
	}

	validateToken(token: string) {
		if (!this.validate) return true;

		const foundToken = this.tokens.find((t) => t.access_token === token);
		if (foundToken) {
			return true;
		}
		return false;
	}
}
