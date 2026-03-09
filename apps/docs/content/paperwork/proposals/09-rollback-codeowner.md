---
title: 09 - Rollback Codeowner
---

Rollback `Codeowner` file with default project Alex PR inclusion.

## WHY

Including the Project Alex GitHub team on every PR sends out a ping to
all users on the team. To avoid notification fatigue, this is being disabled.

## WHAT

The default assignment of the Project Alex Team on every opened PR is being
removed, removing the Codeowner ownership.

## IMPLEMENTATION STEPS

1. Remove the `Codeowner` line for the GitHub Project Alex team

## ROLLBACK STEPS

IF production fails, declare an Incident and rollbck.
