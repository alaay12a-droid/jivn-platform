---
name: Wouter query routing
description: Query-string navigation in the admin UI must use Wouter's search hook.
---

Wouter's `useLocation()` returns the pathname without the query string; read tab and other query parameters with `useSearch()`.

**Why:** Parsing queries from `useLocation()` made the admin tab and development access flag disappear, causing redirects and making sidebar navigation appear broken.

**How to apply:** Import `useSearch` for query state, keep `useLocation` for pathname navigation, and cover query-driven tab changes in browser tests.