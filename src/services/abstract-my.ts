import type {
	InsufficientScopeError,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import type { FastifyRequest } from "fastify";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { RepositoryContext } from "#src/repositories/abstract.ts";
import { getRepositoryContext } from "#src/repositories/helpers.ts";
import AbstractService from "./abstract.ts";

type ScopedRequest = FastifyRequest<{ Params: Record<string, string> }>;

export type MyIdentity =
	| { type: "customer"; id: string }
	| { type: "anonymous"; id: string };

/**
 * What a `/me` resource needs to declare so the endpoint can be scoped to the
 * caller.
 */
export type MyResourceRules = {
	/** Predicate limiting a query to the customer the token was issued for. */
	customerWhere: (customerId: string) => string;

	/** Predicate limiting a query to the anonymous session, when supported. */
	anonymousWhere?: (anonymousId: string) => string;

	/** The customer a stored resource belongs to. */
	customerOf: (resource: any) => string | undefined;

	/** The anonymous session a stored resource belongs to. */
	anonymousOf?: (resource: any) => string | undefined;

	/** Stamps the caller onto a create draft, so they can read it back. */
	stampDraft?: (draft: any, identity: MyIdentity) => any;
};

/**
 * Base for the `/me` services.
 *
 * The `/me` endpoints answer for whoever the token was issued to, so a request
 * without a customer or anonymous token has no answer to give. It is refused
 * rather than served from the whole collection: returning another customer's
 * order to an unauthenticated caller turns an ownership test into one that
 * passes without asserting anything.
 */
export default abstract class AbstractMyService extends AbstractService {
	protected abstract myRules: MyResourceRules;

	protected identityOf(context: RepositoryContext): MyIdentity {
		if (context.customerId) {
			return { type: "customer", id: context.customerId };
		}
		if (context.anonymousId && this.myRules.anonymousWhere) {
			return { type: "anonymous", id: context.anonymousId };
		}

		throw new CommercetoolsError<InsufficientScopeError>(
			{
				code: "insufficient_scope",
				message:
					"This endpoint requires a token issued for a customer or an anonymous session.",
			},
			403,
		);
	}

	protected owns(identity: MyIdentity, resource: unknown): boolean {
		if (identity.type === "customer") {
			return this.myRules.customerOf(resource) === identity.id;
		}
		return this.myRules.anonymousOf?.(resource) === identity.id;
	}

	protected override async scopeWhere(
		request: ScopedRequest,
	): Promise<string[]> {
		const identity = this.identityOf(getRepositoryContext(request));
		return [
			identity.type === "customer"
				? this.myRules.customerWhere(identity.id)
				: // biome-ignore lint/style/noNonNullAssertion: identityOf only
					// returns an anonymous identity when the predicate exists
					this.myRules.anonymousWhere!(identity.id),
		];
	}

	protected override async authorizeResource(
		request: ScopedRequest,
		_operation: "view" | "update" | "delete",
		resource: unknown,
	): Promise<void> {
		const identity = this.identityOf(getRepositoryContext(request));
		if (this.owns(identity, resource)) {
			return;
		}

		// Someone else's resource does not exist as far as /me is concerned
		const { id, key } = request.params;
		throw new CommercetoolsError<ResourceNotFoundError>(
			{
				code: "ResourceNotFound",
				message: id
					? `The Resource with ID '${id}' was not found.`
					: `The Resource with key '${key}' was not found.`,
			},
			404,
		);
	}

	protected override async authorizeCreate(
		request: ScopedRequest,
		draft: unknown,
	): Promise<unknown> {
		const identity = this.identityOf(getRepositoryContext(request));
		return this.myRules.stampDraft?.(draft, identity) ?? draft;
	}
}
