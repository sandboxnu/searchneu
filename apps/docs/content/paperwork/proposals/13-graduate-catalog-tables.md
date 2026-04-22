---
title: 13 - add catalog scraper tables
---

## WHY

No longer using old graduate API so we need to actually store the response from the major scraper somewhere. The resposne will live in two new tables, `catalogMajors` and `catalogMinors`

## WHAT

added two new tables in the searchneu database to store all the relevant information we need from the course catalog major scraper

## IMPLEMENTATION STEPS

1. Have database admin get Neon prod key
2. Database admin runs `db:push`
3. New column should create
4. Check SearchNEU live site to ensure majors are fetched properly

## ROLLBACK STEPS

This is the HOW... if something goes wrong. How will you revert back to the original
state? What tests will show when something goes wrong? ie:

1. IF GraduateNU audit table CRUD doesn't work
2. Rollback to database snapshot
3. Update Vercel prod DB URL
4. Check SearchNEU live site to ensure graduate works

## APPENDIX
