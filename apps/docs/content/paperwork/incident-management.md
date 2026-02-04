---
title: Incident Management
icon: FileExclamationPoint
---

This PCP establishes a lightweight incident management process for SearchNEU. The
goal is to provide a clear, minimal-overhead framework for handling production
issues that balances our responsibility to real users with the reality that this
is a volunteer project with limited time.

## WHY

SearchNEU has real users who depend on the platform, particularly during critical
periods like course registration. When things break, we need a shared understanding
of how to communicate, respond, and learn from incidents. Without a process:

- Issues may go unnoticed or unaddressed
- Multiple people may work on the same problem without coordination
- Knowledge about what went wrong gets lost
- The same issues may recur

However, we're not a company with on-call rotations and dedicated SREs. This process
needs to be lightweight enough that it doesn't become a burden, but structured
enough that our users aren't left in the dark when something breaks.

## WHAT

### Defining an Incident

An incident is any unplanned event that causes or risks significant degradation
to SearchNEU for end users. This includes:

- Site is down or inaccessible
- Core functionality is broken (search not working, results not loading)
- Data integrity issues (wrong course data being displayed)
- Security breaches or vulnerabilities being actively exploited
- Failed PCP rollouts that leave prod in a broken or partial state

An incident is not:

- A bug that affects a small subset of users or edge cases
- A feature not working as intended but with a reasonable workaround
- Planned maintenance or downtime

When in doubt, err on the side of declaring an incident! It is easier to close a
non-incident than to recover from an unmanaged one.

### Severity Levels

To keep things simple, we use two severity levels:

| Severity | Name     | Description                                                       | Response Expectation              |
| -------- | -------- | ----------------------------------------------------------------- | --------------------------------- |
| S1       | Critical | Site is down, core features completely broken, or security breach | Respond ASAP, all hands if needed |
| S2       | Degraded | Partial outage, significant feature broken, or data issues        | Respond within a few hours        |

Don't overthink severity, just pick one and move on. You can always adjust later.

### Roles

**Incident Commander (IC):** The person who declares the incident owns it until
they explicitly hand it off or close it. The IC is responsible for:

- Communicating status in the incident channel
- Coordinating response efforts
- Deciding when the incident is resolved
- Ensuring a post-mortem happens (for S1) or is not needed (for S2)

Anyone can be IC. You don't need permission. If you see a fire, you're the firefighter
until someone else takes over.

### Incident Lifecycle

1. **Declaration**
   When you identify an incident:
   1. Post in `#proj-alex`: "🚨 Incident declared: [brief description]"
   2. Assign yourself as IC (or ask someone else to take it)
   3. Set the severity level (S1 or S2)

   Example:

   > 🚨 Incident declared: Search returning 500 errors for all queries
   > Severity: S1
   > IC: @yourname

2. **Response**
   - **Communicate in the incident channel**, not DMs! Visibility matters!
   - Post updates every 15-30 minutes for S1, hourly for S2 (even if the update
     is "still investigating")
   - If you need help, ask for it explicitly
   - If you need to hand off IC, do so explicitly: "Handing IC to @someone"

3. **Resolution**
   When the immediate issue is fixed:
   1. Confirm the fix is working in production
   2. Post in the incident channel: "✅ Incident resolved: [brief summary of fix]"
   3. For S1 incidents, schedule a post-mortem within one week

### Post-Mortems

Post-mortems are required for S1 incidents and optional for S2 incidents.
The goal is learning, not blame. Keep it short and useful:

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

Post-mortems should be filed in `apps/docs/content/paperwork/incidents/` and
reviewed at the next team sync. They don't need to be long—a useful post-mortem
can be 10 lines.

## IMPLEMENTATION STEPS

1. Merge this PCP
2. Create `apps/docs/content/paperwork/incidents/` directory for post-mortems
3. Add post-mortem template to the directory as `_template.md`
4. Link to this process from the main PCP document's Incidents section
5. Announce the process in the main team channel

## ROLLBACK STEPS

This PCP establishes a process, not a technical change. If the process isn't working:

1. Discuss at team sync what isn't working
2. Either iterate on this document via a standard PR (minor changes) or file a new
   PCP (major changes)
3. If the team decides incident management is unnecessary overhead, this document
   can be archived

## RESOURCES

- Post-mortem template included above
- [Atlassian Incident Management Guide](https://www.atlassian.com/incident-management)
  (reference, not prescription)
