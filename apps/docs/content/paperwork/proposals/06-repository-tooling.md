---
title: 06 - repository tooling
---

Add tooling to ensure consistent styling, linting, and checks for standardized
code. Since Search is mostly worked on by students, having additional checks which
ensure some of the (somewhat) arbitrary rules allows for automatic, quick, and useful
feedback to iterate.

## WHY

Adding additional checks for a branch before it can be merged helps improve code
quality, as well as provide developers with instant and useful feedback. In
addition, it creates systems that outlive a particular code-reviewer, hopefully
maintaining code quality moving forward.

## WHAT

- Prettier added codebase wide, enforcing a standard format and ensuring automatic
  formatting
- ESLint added codebase wide, providing lint warnings on undesireable and unsafe
  code
- Automated CI Checks
  - Ensures formatted code
  - Ensures linted code (and displays warning in-line on GitHub)

## IMPLEMENTATION STEPS

New workflows will be merged via traditional PR

## ROLLBACK STEPS

1. Merge PR adding new workflows
2. Check production systems
3. IF production is non-responsive / no longer GitHub linked:
   - Declare Incident
   - Rollback changes
   - Redeploy
