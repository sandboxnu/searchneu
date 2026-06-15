# @sneu/cli

Supporting CLI for one-off local/prod tasks (scraping, seeding, uploads).

- Invoke from the repo root as `turbo cli -- <args>` (the `--` is required).
- Commands are built with `citty`; interactive prompts use `@clack/prompts`.
- Reads env from a local `.env`. Depends on `@sneu/db` and `@sneu/scraper`.
