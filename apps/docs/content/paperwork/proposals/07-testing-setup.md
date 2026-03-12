---
title: 07 - Testing Setup
---

Create standardized testing framework codebase wide.

## WHY

With Search having real users and growing in size, automated code testing is
increasingly important in ensuring that no regressions happen when new code
is shipped. Creating an opinionated system that enables testing to take place
will help ease testing in the future.

## WHAT

Testing commands will be added to packages, which searches for files with a
`.test.ts` file type. These files will then be run using NodeJS's native test
runner, connecting `tsx` to enable Typescript support. Additionally, the scraper
will use the `nock` package to test against fake Banner endpoints.

## IMPLEMENTATION STEPS

Packages will be installed via `pnpm` in the approriate package / app level
`package.json`. A `test` command will be added to the necessary `package.json`
files which runs the NodeJS native tester. The CI runner will be updated to use
`turbo` to run the `test` command across all packages / apps. Changes will be
merged via traditional PR.

## ROLLBACK STEPS

IF production fails to deploy with the changes, an Incident will be declared
and the changes rolled back.
