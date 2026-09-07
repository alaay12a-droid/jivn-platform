---
name: GitHub upload WAF
description: GitHub integration writes can trigger a temporary Cloudflare block after repeated or large Git Data API mutations.
---

Use the authenticated GitHub client for repository writes, keep mutation requests sparse and sequential, and verify the branch after every publishing attempt. If Cloudflare returns an HTML 403, stop retrying aggressively; the repository may remain unchanged even when isolated small writes succeed.

**Why:** Repeated blob, tree, and GraphQL mutations from the Replit environment triggered Cloudflare protection while read requests and isolated writes continued to work.

**How to apply:** Prefer a single compact write strategy when possible, preserve the local tree, and allow the block to clear before another attempt.