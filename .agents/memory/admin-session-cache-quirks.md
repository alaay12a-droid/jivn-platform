---
name: Admin session and API cache quirks
description: Cookie scope and HTTP caching constraints for the hidden admin flow.
---

Admin API responses must not be conditionally cached, and the unlock cookie must be scoped to `/` so it is sent when the web artifact is mounted below a path prefix.

**Why:** A `304` response is not treated as successful by the generated API client, and a narrower cookie path can omit the unlock session from proxied artifact requests.

**How to apply:** Keep API responses `no-store`, use a root-scoped HttpOnly unlock cookie, and make browser API requests include credentials.