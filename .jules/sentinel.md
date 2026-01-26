## 2026-01-26 - [DoS via Unvalidated Range]
**Vulnerability:** The `/api/compare` endpoint accepted `start` and `end` gameweek parameters without validation. A malicious user could provide extremely large values, causing `Array.from({ length: end - start + 1 })` to attempt a massive memory allocation, potentially crashing the Node.js process (OOM).
**Learning:** Even without a database, Next.js API routes are susceptible to resource exhaustion attacks if query parameters control loop counts or array sizes.
**Prevention:** Always enforce strict bounds on numeric inputs from users. For FPL, gameweeks are always between 1 and 38.
