---
name: Idempotent seed data
description: Prevents repeated default content when more than one server process initializes the database.
---

Default site content can be initialized concurrently by multiple server processes. A “check then insert” seed guard alone is not sufficient; seeded labels need database uniqueness and inserts should ignore conflicts.

**Why:** The same feature and restaurant placeholder rows were created multiple times during concurrent startup, and the public page rendered every copy.

**How to apply:** Clean existing duplicate defaults, add unique constraints for stable seed labels, and use conflict-safe inserts while preserving the existing conditional seed behavior.