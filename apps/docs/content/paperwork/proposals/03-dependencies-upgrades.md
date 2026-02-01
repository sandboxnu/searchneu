---
title: 03 - Dependency Upgrades
---

This PCP establishes a standing process for routine dependency upgrades. Rather
than requiring a separate PCP for each upgrade, which would create friction and
discourage keeping dependencies current, this document serves as the single PCP
that any dependency upgrade PR can reference.

## WHY

Keeping dependencies up to date is important for security, performance, and
maintainability. However, dependency changes technically fall under "changes in
external dependencies" which would normally require a PCP.

Requiring a full PCP for every `pnpm update` would:

- Create unnecessary overhead that discourages regular updates
- Lead to outdated dependencies and accumulated tech debt
- Make security patches slower to deploy

This standing PCP removes that friction while still ensuring dependency upgrades
follow a consistent, safe process.

## WHAT

### Covered under this PCP

The following dependency changes can reference this PCP instead of filing a new
one:

- Patch version updates (1.0.0 → 1.0.1)
- Minor version updates (1.0.0 → 1.1.0)
- Major version updates that don't require code changes
- Security patches at any version level

### NOT Covered under this PCP

The following require their own PCP:

- Major version upgrades that require code changes or migrations
- Adding new dependencies that introduce new capabilities or patterns
- Removing dependencies that other packages rely on
- Changing package managers or build tools
- Any upgrade that changes our public API or data formats

When in doubt: if the upgrade requires more than updating version numbers and
running tests, it probably needs its own PCP.

## Guidelines

### Before Upgrading

1. Check the changelog/release notes for breaking changes
2. For major versions, skim the migration guide if one exists
3. Verify CI is passing on main before starting

### Dependency upgrade PRs should

- Reference this PCP in the PR description: "Per PCP-03"
- Note any deprecation warnings or breaking changes mentioned in changelogs
- Include a brief reason if upgrading a specific package (e.g., "security patch"
  or "fixes issue #123")

### Testing

- All CI checks must pass
- For major version upgrades, manually verify core functionality works:
  - Search returns results
  - Course pages load
  - No console errors in browser

### Batching

- Patch and minor updates can be batched together
- Major version upgrades should be in separate PRs (one per package)
- Security patches can be fast-tracked and merged independently

## IMPLEMENTATION STEPS

1. Merge this PCP
2. Future dependency upgrade PRs reference "PCP-03" instead of filing new PCPs
3. Add a recurring reminder (monthly or quarterly) to check for dependency updates

## ROLLBACK STEPS

Dependency upgrades are easily rolled back via git:

1. Revert the merge commit: `git revert <commit-sha>`
2. Open PR for the revert
3. Merge revert PR (can bypass normal review for urgent issues)
4. Investigate what broke before re-attempting the upgrade

If a dependency upgrade causes a production incident, follow the incident management
process and document the issue in the post-mortem.

## RESOURCES

- `pnpm outdated` to see all outdated packages
  - `--recursive` / `-r` to target all packages / apps
- `pnpm update` to update packages
  - `--recursive` / `-r` to target all packages / apps
  - `--interactive` / `-i` to show an interactive interface
  - `--latest` / `-L` to update to latest stable version (potentially upgrading
    the packages across major versions)
- `pnpm audit` to check for known vulnerabilities (note that this... is not that
  great. Transient deps usually have the issue and require manual patches)
  - `--recursive` / `-r` to target all packages / apps
