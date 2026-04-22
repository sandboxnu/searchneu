---
title: 12 - next config change
---

Removes the rewrite to old graduate API as we no longer need it now that we are storing major scraper json in new db tables

## WHY

Rewrite function is no longer needed. We will be taking old graduate down soon and do not need a URL proxy to it

## WHAT

Removed graduate source and destination from rewrite function. It was the only one so I removed the entire rewrites declaration.

## IMPLEMENTATION STEPS

None

## ROLLBACK STEPS

This is the HOW... if something goes wrong. How will you revert back to the original
state? What tests will show when something goes wrong? ie:

1. Revert to old config, reset to prior commit

## APPENDIX
