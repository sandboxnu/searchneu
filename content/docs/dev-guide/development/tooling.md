---
title: Tooling
description: Developer and debuging tools
---

## Local Development

For local development there are some integrated tools to help debug and identify
issues.

### React Webtools

The greatest tool for debuging and developing with React is the [React Devtools](...)
extension. It provides a component tree for the virutal dom, allowing inspection
of state and any other hooks / props.

### React Scan

If enabled through the manual debug override or the signed in user is marked as
an admin in the database, then [React Scan](...) will load up on the page. By
default it is enabled, and will show every component rerender on the page by
highlighting it in a purple box.

The main controls for it should appear in a corner (default bottom right) of
the screen. Toggling the swich to off will disable the rerender highlights. The
menu also contains the fps of the page, an inspector, and a history of the last
rerenders (and their timing). All of these aid in finding performance bottlenecks
and bugs in React which are causing expensive or excessive rerenders.

### Vercel Toolbar
