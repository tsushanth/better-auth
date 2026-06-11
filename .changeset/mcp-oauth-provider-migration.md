---
"better-auth": minor
"@better-auth/oauth-provider": minor
---

The MCP plugin now lives in the `@better-auth/oauth-provider` package and is built on the OAuth 2.1 / OIDC provider. Import the server plugin and its helpers from `@better-auth/oauth-provider/mcp`, and the remote MCP client and adapters from `@better-auth/oauth-provider/mcp/client` and `@better-auth/oauth-provider/mcp/client/adapters`. The OAuth endpoints moved under `/oauth2/*` (`/oauth2/authorize`, `/oauth2/token`, `/oauth2/register`, `/oauth2/userinfo`), with discovery at `/.well-known/oauth-authorization-server` and protected resource metadata at `/.well-known/oauth-protected-resource`. Spec-compliant MCP clients rediscover endpoints through discovery, so the move is transparent to them.

ID and access tokens now sign with the JWT plugin's stable key instead of an ephemeral key, so resource servers can verify them against the published JWKS. Consent and PKCE are enforced for untrusted and public clients. `withMcpAuth` now verifies the bearer token locally (signature, issuer, audience, expiry) and passes the verified JWT claims to your handler; it no longer returns a database record or a refresh token.

To migrate: replace `better-auth/plugins` MCP imports with `@better-auth/oauth-provider/mcp`, and add the `jwt()` plugin to your `plugins` array (it is now required for token signing). Move options that were nested under `oidcConfig` to flat options on `mcp({ ... })`, which are the OAuth provider options. The database models changed (`oauthApplication` is now `oauthClient`, plus new `oauthRefreshToken` and `oauthClientAssertion` tables), so regenerate or migrate your schema with `npx auth migrate` or `npx auth generate`.
