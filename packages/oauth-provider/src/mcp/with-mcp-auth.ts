import { verifyAccessToken } from "better-auth/oauth2";
import type { BetterAuthOptions } from "better-auth/types";
import type { JWTPayload } from "jose";
import type { Awaitable } from "../types/helpers";

interface WithMcpAuthOptions {
	/**
	 * The protected resource identifier the access token must be audience-bound
	 * to. Defaults to the server origin.
	 */
	resource?: string;
	/**
	 * Expected token issuer. Defaults to the configured `baseURL`. Override when
	 * the JWT plugin is configured with a custom `jwt.issuer`.
	 */
	issuer?: string;
	/**
	 * URL of the authorization server's JWKS. Defaults to the JWT plugin
	 * endpoint under the configured `basePath` (`<baseURL>/api/auth/jwks`).
	 */
	jwksUrl?: string;
}

const unauthorized = (message: string, resourceMetadata: string): Response =>
	new Response(
		JSON.stringify({
			jsonrpc: "2.0",
			error: { code: -32000, message },
			id: null,
		}),
		{
			status: 401,
			headers: {
				"Content-Type": "application/json",
				"WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}"`,
				"Access-Control-Expose-Headers": "WWW-Authenticate",
			},
		},
	);

/**
 * Protects an MCP server route handler. Verifies the bearer access token
 * against the authorization server's JWKS (checking signature, issuer,
 * audience, and expiry) and forwards the verified JWT payload to the handler.
 * Unauthenticated requests receive a JSON-RPC 401 with the RFC 9728
 * `WWW-Authenticate` header so MCP clients can start the authorization flow.
 *
 * For a resource server that runs separately from the authorization server, or
 * a server using a dynamic `baseURL`, use {@link mcpHandler} with explicit
 * verification options instead.
 *
 * @external
 */
export const withMcpAuth = <Auth extends { options: BetterAuthOptions }>(
	auth: Auth,
	handler: (req: Request, jwt: JWTPayload) => Awaitable<Response>,
	opts?: WithMcpAuthOptions,
) => {
	const baseURL = auth.options.baseURL;
	if (typeof baseURL !== "string") {
		throw new Error(
			"withMcpAuth requires a static string `baseURL`. For dynamic base URLs use `mcpHandler` with explicit verify options.",
		);
	}
	const origin = new URL(baseURL).origin;
	const basePath = auth.options.basePath ?? "/api/auth";
	const resource = opts?.resource ?? origin;
	const issuer = opts?.issuer ?? baseURL;
	const jwksUrl = opts?.jwksUrl ?? `${baseURL}${basePath}/jwks`;
	// RFC 9728: the resource metadata URL inserts the resource path after the
	// well-known segment, so a resource with a path resolves correctly.
	const resourceUrl = new URL(resource);
	const resourcePath =
		resourceUrl.pathname === "/" ? "" : resourceUrl.pathname.replace(/\/$/, "");
	const resourceMetadata = `${resourceUrl.origin}/.well-known/oauth-protected-resource${resourcePath}`;

	return async (req: Request): Promise<Response> => {
		const authorization = req.headers?.get("authorization") ?? undefined;
		const accessToken = authorization?.startsWith("Bearer ")
			? authorization.slice("Bearer ".length)
			: authorization;
		if (!accessToken?.length) {
			return unauthorized(
				"Unauthorized: Authentication required",
				resourceMetadata,
			);
		}
		try {
			const jwt = await verifyAccessToken(accessToken, {
				verifyOptions: { issuer, audience: resource },
				jwksUrl,
			});
			return handler(req, jwt);
		} catch {
			return unauthorized("Unauthorized: invalid token", resourceMetadata);
		}
	};
};
