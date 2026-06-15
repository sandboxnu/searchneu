# @sneu/scraper

Scrapes Northeastern's Banner site for course information.

- Validate scraped/external data with Zod. HTTP responses are mocked in tests
  with `nock` — do not hit live Banner in tests.
- `pnpm test` runs `node --test` over `**/*.test.ts` (via tsx).
