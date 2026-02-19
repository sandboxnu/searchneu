---
title: 05 - Flexible majors
---

changing the type of the major and minor attribute in auditplans to be text[] vs text

## WHY

we want to support flexible major plans that have multiple majors and multiple minors

## WHAT

auditPlansT.major : text -> auditPlansT.major : text[]
auditPlansT.minor : text -> auditPlansT.minor : text[]

## IMPLEMENTATION STEPS

1. Change database schema to above
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
