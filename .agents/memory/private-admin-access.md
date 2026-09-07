---
name: Private admin access
description: The website's hidden admin entry and server-side unlock behavior.
---

The public site intentionally has no admin link. The private entry is a four-press gesture on the Jivn logo, followed by a server-verified unlock code stored in Replit Secrets; access is represented by a short-lived signed HttpOnly cookie.

**Why:** The owner asked for a discreet personal entry while keeping the unlock value out of browser code and preserving the existing Clerk-compatible admin API guard.

**How to apply:** Do not place the unlock code in frontend source, URLs, local storage, or analytics. Keep direct admin access behind the signed cookie and retain the lock action when signing out.