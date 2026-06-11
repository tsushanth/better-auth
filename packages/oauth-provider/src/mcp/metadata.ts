import type { GenericEndpointContext } from "@better-auth/core";
import type { OAuthOptions } from "../types";

/**
 * Default scopes advertised by an MCP authorization server. `offline_access`
 * is included so MCP clients can obtain refresh tokens for long-lived sessions.
 */
export const DEFAULT_MCP_SCOPES = [
	"openid",
	"profile",
	"email",
	"offline_access",
] as const;

/**
 * Options for the {@link mcp} plugin. Extends the full OAuth provider
 * configuration with the MCP resource identifier.
 */
export interface MCPOptions extends OAuthOptions {
	/**
	 * The protected resource identifier (RFC 8707 / RFC 9728) that access
	 * tokens are bound to. Advertised as `resource` in the protected resource
	 * metadata and used as the token audience.
	 *
	 * @default the server origin
	 */
	resource?: string;
}

/**
 * RFC 9728 Protected Resource Metadata for an MCP resource server.
 *
 * The authorization server's keys and endpoints are discovered separately
 * through `/.well-known/oauth-authorization-server`; this document only
 * describes the resource itself and which authorization server protects it.
 */
export interface MCPProtectedResourceMetadata {
	resource: string;
	authorization_servers: string[];
	scopes_supported: string[];
	bearer_methods_supported: ["header"];
}

export const getMcpProtectedResourceMetadata = (
	ctx: GenericEndpointContext,
	options: MCPOptions,
): MCPProtectedResourceMetadata => {
	const origin = new URL(ctx.context.baseURL).origin;
	return {
		resource: options.resource ?? origin,
		authorization_servers: [origin],
		scopes_supported: options.scopes
			? [...options.scopes]
			: [...DEFAULT_MCP_SCOPES],
		bearer_methods_supported: ["header"],
	};
};
