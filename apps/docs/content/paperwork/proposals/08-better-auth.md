---
title: 08 - Better Auth
---

Replace hand-rolled authentication system with Better Auth.

## WHY

The existing authentication system for SearchNEU is simple by design. Search
does not have difficult authentication requirements, but the existing system
is beginning to have issues. Notablely there are several known security bugs,
specifcally around timing attacks, which would be costly to fix. Additionally,
issues such as Vercel's preview deployments (which do not have static callback urls)
make authentication on PR previews difficult / impossible.

## WHAT

The old auth system will be entirely removed. Better Auth will be initialized
and used in its default configuration with no additional plugins. All previous
auth calls will be replaced with Better Auth calls instead.

The authentication tables and endpoints will be created in the respective
packages / applications.

## IMPLEMENTATION STEPS

1. Install the Better Auth package
2. Create the necessary files to initialize Better Auth
3. Rewrite the DB tables to switch to Better Auth requirements
4. Rewrite auth calls to use Better Auth
5. Open traditional PR
6. Snapshot DB and download local copy
7. Merge PR and migrate prod DB
8. Test authentication funcationality in Prod

## ROLLBACK STEPS

1. Declare Incident
2. Restore DB based on snapshot
3. Rollback Vercel deployment
4. Rollback PR
