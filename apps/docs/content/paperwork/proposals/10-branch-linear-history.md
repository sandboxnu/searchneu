---
title: 10 - Branch Linear History
---

Add a CI check to require linear history on development branches.

## WHY

Development branches (ie branches being merged into `main`) should have
a linear history for git cleanliness. The most important part to avoid
is merging `main` into a development branch, then merging that development
branch into `main`. This creates a merge commit on the branch which does not
play nicely with future development.

## WHAT

A CI check which ensures no merge commits on the branch exist. This can
be overwritten for a specific branch by commenting with `/allow-merges`.

## IMPLEMENTATION STEPS

1. Add aforementioned CI check
2. Merge via traditional PR

## ROLLBACK STEPS

IF production resources are affected, declare an Incident and rollback.
