import { createAuthEndpoint } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth/types";
import { oauthProvider } from "../oauth";
import type { MCPOptions } from "./metadata";
import {
	DEFAULT_MCP_SCOPES,
	getMcpProtectedResourceMetadata,
} from "./metadata";

/**
 * Model Context Protocol authorization server.
 *
 * `mcp()` configures the OAuth 2.1 / OIDC provider ({@link oauthProvider}) with
 * MCP-appropriate defaults and adds the RFC 9728 protected resource metadata
 * endpoint. It serves the standard `/oauth2/*` endpoints and the
 * `/.well-known/oauth-authorization-server` document, so MCP clients discover
 * and use it through normal OAuth discovery.
 *
 * Because it is the OAuth provider, `mcp()` cannot be combined with a separate
 * {@link oauthProvider} instance in the same app.
 *
 * @example
 * ```ts
 * import { betterAuth } from "better-auth";
 * import { jwt } from "better-auth/plugins";
 * import { mcp } from "@better-auth/oauth-provider/mcp";
 *
 * export const auth = betterAuth({
 *   plugins: [jwt(), mcp({ loginPage: "/login", consentPage: "/consent" })],
 * });
 * ```
 */
export const mcp = (options: MCPOptions) => {
	const { resource, ...oauthOptions } = options;
	const provider = oauthProvider({
		// MCP clients self-register; public clients use PKCE without a secret.
		allowDynamicClientRegistration: true,
		allowUnauthenticatedClientRegistration: true,
		...oauthOptions,
		scopes: oauthOptions.scopes ?? [...DEFAULT_MCP_SCOPES],
	});
	return {
		...provider,
		endpoints: {
			...provider.endpoints,
			getMcpProtectedResource: createAuthEndpoint(
				"/.well-known/oauth-protected-resource",
				{ method: "GET" },
				async (ctx) => {
					return ctx.json(getMcpProtectedResourceMetadata(ctx, options));
				},
			),
		},
	} satisfies BetterAuthPlugin;
};
