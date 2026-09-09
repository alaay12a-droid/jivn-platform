---
name: Netlify Clerk asset redirects
description: Cross-origin Clerk asset redirects caused by an external Netlify rewrite.
---

When a static Netlify frontend uses a relative Clerk proxy path through an external rewrite to the Replit API, the versionless Clerk JS asset request can return a redirect to the backend hostname instead of preserving the frontend origin. The browser can reject that redirected script, leaving Clerk unloaded even though the proxy environment endpoint returns 200.

**Why:** API JSON requests and direct versioned assets may succeed while the initial Clerk bootstrap still fails, so checking only `/api/__clerk/v1/environment` is insufficient.

**How to apply:** Verify the versionless Clerk JS request in a clean browser and inspect its redirect target before declaring Netlify Clerk authentication fixed. Prefer preserving the frontend origin for the asset redirect rather than moving session traffic to the backend hostname.