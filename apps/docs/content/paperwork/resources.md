---
title: Resources
description: Templates for the different documents
icon: PencilRuler
---

## Platform Change Proposals (PCP) Documents

### PCP Template

The template for a Platform Change Proposal. This will be filed under
`apps/docs/content/paperwork/proposals` and is the actual proposal body.

```md
---
title: <pcp-num> - <pcp-name>
---

A brief abstract / summary of the proposed changes

## WHY

Why is this change needed? Why does the existing model not have the needed resources?
Why was it implimented in the proposed way? This should be both technical in nature
(ie we need a new database table) but also the reason behind that (ie we need to
store the courses the user has taken).

## WHAT

What exactly is being changed? This is where the changes should be described in
exacting detail! What table is being added, what is the schema, what are the relationships?
This should also have a list of all the resources being changes (ie prod Neon)

## IMPLIMENTATION STEPS

This is the HOW. How will the current state of the app be migrated to the proposed
state? No need to identify stakeholders yet (save that for the Pull Request, since
that information can get stale), but what commands will be run, what permissions
are needed, and what tests will be run? This should probably be a numbered list
of steps ie:

1. Have database admin get Neon prod key
2. Database admin runs `db:push`
3. New column should create, select "rename" option for renamed column
4. Check SearchNEU live site to ensure catalog still searches

## ROLLBACK STEPS

This is the HOW... if something goes wrong. How will you revert back to the original
state? What tests will show when something goes wrong? ie:

1. IF SearchNEU live site catalog does not search:
2. Rollback to database snapshot
3. Update Vercel prod DB URL
4. Check SearchNEU live site to ensure catalog searches

If during a PCP a rollback happens, an Incident **must** be declared!

## APPENDIX

Anything that might be useful to attach! Adding a service, link that here! There
is no expectation that is space is used :)
```

### PCP PR Template

This should be the template used for the PR body in GitHub when submitting a PCP
for review.

```md
# Platform Change Proposal

Copy of the brief PCP abstract (just copy pasta it)

## Related

(if applicable) Draft Dev PR: <link here> (this should be the draft PR of the proposed
change)
Ticket(s): <ticket(s) here> (list of tickets that this change is for)

## Details

### Devs Involved

Mention (@) all people that will be involved! Remember don't go do a prod change
alone! Best to bring a friend :)

### Timeline

Give a brief idea on the timeline (when will these changes be deployed)?
```

## Incident Template

```md
## Incident Post-Mortem: [Date] - [Brief Title]

### Summary

What happened, in 2-3 sentences.

### Timeline

- HH:MM - Thing happened
- HH:MM - We noticed
- HH:MM - We fixed it

### Root Cause

Why did this happen? (Not "who"—"why")

### What Went Well

- Thing that helped

### What Could Improve

- Thing we could do better

### Action Items

- [ ] Concrete thing to prevent recurrence
```
