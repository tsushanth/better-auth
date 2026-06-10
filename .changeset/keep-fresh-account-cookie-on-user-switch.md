---
"better-auth": patch
---

Signing in as a different user no longer drops the new user's account cookie, which broke access token retrieval in database-less setups.
