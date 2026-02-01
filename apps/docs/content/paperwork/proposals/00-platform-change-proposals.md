---
title: 00 - Platform Change Proposals
---

Platform Change Proposals (PCPs) create a process for any changes to SearchNEU
infrastructure or APIs which would affect multiple teams / parties. These documents
serve to detail all aspects of a proposed change so that stakeholders can review
and contribute feedback, as well as detail the process and rollback plans for changes.

## WHY

With SearchNEU becoming a product that has real users and multiple teams working
at the same time on it, a process to document "Platform" changes seems to be required.
These "Platform" changes are either changes in shared resources (ie infrastructure)
or in the APIs between internal packages where a change could affect multiple teams.
The PCP process is not meant to be heavy or time-consuming, but require thought
and communication in order to alter any shared resources, benefiting the other
teams working on SearchNEU and our end users.

To provide a concrete example, imagine a database change which adds a table and
renames a column in a different table. In order to deploy these changes, a manual
database migration to roll out the changes are required, which should be tested
and have a rollback plan in case something goes wrong. Additionally a database
change affects all the current teams, who have to deploy the changes to their
local database instances as well. A PCP detailing the change, followed by a discussion
and review aim to ensure that everyone's feedback is heard and a proper plan
for the change is detailed.

## WHAT

Platform Change Proposals are a written Markdown (md) file which details the exact
proposed changes to the SearchNEU platform. These changes include:

- Any change to infrastructure (ie Vercel, Twilio, Github, etc.)
- Any changes in external dependencies (ie npm packages)
- Creation or deletion of packages / applications in the monorepo
- Changes in the API between packages / applications (ie changing exports)
- Changes in public API or permalink URLs in applications

These are meant to capture any changes which affect coupled resources that could
propagate between Sandbox Teams or SearchNEU's external API consumers. The above
list is not comprehensive but rather tries to capture as many categories of changes
which would require communication in their implementation between the many downstream
consumers of those dependencies.

PCPs are **not** required for most changes, even if they are "breaking" in terms
of functionality. Examples of changes that do NOT require a PCP:

- Bug fixes that don't alter APIs or infrastructure
- New features contained within a single package that don't affect shared interfaces
- UI/UX changes that don't affect permalinks or public URLs
- Internal refactors that maintain the same external API contract
- Documentation updates
- Test additions or modifications

PCPs are targeted for internal or external API changes, which should be fairly
infrequent. When in doubt, ask in the team channel before starting a PCP.

## HOW

When a change requiring a PCP is going to be made, the PCP first must be filed.
A new branch should be created titled `pcp/<num-of-pcp>-<name-of-pcp>` and the
PCP should be filled out in the `apps/docs/content/pcps/proposals/<num-of-pcp>-<name-of-pcp>`.
PCPs should be numbered in increasing integer values without duplicates. The title
of the PCP should be a very brief (ideally two to three words) name for quick
reference of the PCP.

Once the PCP is ready for review, a Pull Request should be opened with the name
`[pcp] <num-of-pcp> <name-of-pcp>` and the default PR template replaced with the
PCP PR template. Once the PCP PR template is completely filled out, the PR can be
opened.

### Review Requirements

- PCPs must remain open for a minimum of 48 hours before merging to ensure all
  stakeholders have adequate time to review.
- At least one approving review from each team affected by the proposed change
  is required before merging.
- Additional reviewer requirements can be managed via Codeowners.

A PCP is considered "Accepted" when the Pull Request is merged. If the PR is closed,
the PCP is considered "Rejected" and the changes should be refiled if necessary.
A PCP being "Rejected" does not mean that it will not be "Accepted" in the future.

### Amending an Accepted PCP

If an accepted PCP requires modification before implementation is complete:

- **Minor clarifications:** Update the original PCP document via a standard PR.
- **Significant scope changes:** File a new PCP that references and supersedes the
  original, following the standard PCP process.

Use judgment here—if the change would affect other teams' understanding or planning,
it warrants a new PCP.

## INCIDENTS

Should a PCP fail and either a) leave a broken / partial state in prod or b)
require any degree of rollback, then an Incident must be declared. The purpose
of this is to ensure all stakeholders are aware of the state of any changes and
that as many eyes can get on the issue as possible.

> **Note:** The Incident process is documented separately in [TODO: link to incident
>
> > documentation]. This PCP does not document the Incident process.

## IMPLIMENTATION STEPS

This Platform Change Request will be filed as specified in this document. Once
this document is "Accepted" all future changes that meet the above specifications
will require a PCP.

## ROLLBACK STEPS

If collective team leadership decides that the Platform Change Request model will
not work for the future then the plan and this document will be discarded.

## RESOURCES

### PCP Template

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
