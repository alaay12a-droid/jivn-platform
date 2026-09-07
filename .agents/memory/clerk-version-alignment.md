---
name: Clerk package alignment
description: Clerk React and shared package versions must stay on a compatible release line.
---

Keep `@clerk/react` and `@clerk/shared` on compatible major/minor releases when upgrading authentication dependencies.

**Why:** A mismatched Clerk package tree can pass TypeScript but fail Vite dependency optimization because React imports exports that the resolved shared package does not provide.

**How to apply:** After changing Clerk dependencies, inspect the resolved package versions, run the frontend typecheck and production build, then restart the frontend workflow before debugging application code.