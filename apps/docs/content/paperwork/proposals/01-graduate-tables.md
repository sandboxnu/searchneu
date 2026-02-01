---
title: 01 - Graduate Tables
---

Adding audit plan and graduate metadata tables to the Search database to allow
Search users to connect to their created audit plans and to enable future analytics.

## WHY

We chose this approach over using old Graduate backend service for audit plan -
user management because we don't want to rely on the old service and do user-matching
between Search and Graduate.

## WHAT

This change adds two new tables to the Search database in a way that does not interfere
with the existing Search schema:

## IMPLEMENTATION STEPS

1. Create graduate types in `apps/searchneu/apps/searchneu/lib/graduate/types.ts`,
   no need for db auditPlan types.
2. From `/`, a platform admin/engineer with production DB migrate permissions runs
   `pnpm db:migrate` with `DATABASE_URL` pointing at the production SearchNEU database.
3. Check SearchNEU live site to ensure user auth works

## ROLLBACK STEPS

IF SearchNEU user authentication does not work as expected:

1. Declare a PCP incident according to the incident management process
   (open/update the incident ticket and notify on-call as required).
2. Rollback to database snapshot (undo database migration)
3. Update Vercel prod DB URL
4. Check SearchNEU live site to ensure catalog searches

## APPENDIX
