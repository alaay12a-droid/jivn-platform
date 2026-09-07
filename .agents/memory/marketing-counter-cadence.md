---
name: Marketing counter cadence
description: Rules for the homepage marketing counter's persisted baseline and public API shape.
---

The marketing counter is a portfolio/marketing figure, not live order telemetry. Keep its baseline and daily cadence in PostgreSQL, calculate a small in-progress daily display on the server, and expose only the public displayed value plus enabled state to the website.

**Why:** The site needs a believable gradual increase without implying a connection to restaurant order systems or leaking admin tuning controls publicly.

**How to apply:** Admin changes should reset the daily cycle when cadence bounds change or the operator explicitly resets it; the public UI should animate the returned displayed value only when the section enters the viewport.