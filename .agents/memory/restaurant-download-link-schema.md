---
name: Optional restaurant links
description: Compatibility rule for restaurant app download URLs stored in existing records.
---

Restaurant app download URLs are optional in persisted data, and older restaurant records represent “no link” as an empty string rather than null. API update validation must therefore accept an empty string; the admin form can still require a valid URL when creating or saving a restaurant.

**Why:** A URL-only schema rejected existing records when an administrator cleared a link, making it impossible to restore or edit legacy entries safely.

**How to apply:** Keep database/API output fields as strings, allow empty strings in update validation, and enforce the required URL behavior at the admin form when the product requires a download link.