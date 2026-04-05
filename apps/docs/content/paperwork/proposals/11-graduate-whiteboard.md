---
title: 11 - graduate whiteboard
---

lets graduate users select courses from their plan to fulfill section requirements

## WHY

overall direction of graduate needs to be more "manual"

## WHAT

added a new column in the audit plan table that maps section requirement name -> array of courses student has marked to fulfill this course
each section req also has a status attribute that the user can update manually

## IMPLEMENTATION STEPS

1. Have database admin get Neon prod key
2. Database admin runs `db:push`
3. New column should create
4. Check SearchNEU live site to ensure catalog still searches

## ROLLBACK STEPS

This is the HOW... if something goes wrong. How will you revert back to the original
state? What tests will show when something goes wrong? ie:

1. IF GraduateNU audit table CRUD doesn't work
2. Rollback to database snapshot
3. Update Vercel prod DB URL
4. Check SearchNEU live site to ensure graduate works

## APPENDIX
