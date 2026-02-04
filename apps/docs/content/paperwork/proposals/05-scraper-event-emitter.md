---
title: 05 - Scraper Event Emitter Pattern
---

Refactor the `@sneu/scraper` package to use an event emitter pattern instead of
directly outputting to the command line. This decouples the scraper business logic
from presentation concerns, allowing consuming applications (`@apps/searchneu`
and `@apps/scraper-cli`) to handle output in their own way.

## WHY

The `@sneu/scraper` package currently directly outputs information to the command
line using `consola` and `console` methods. This creates tight coupling between
the scraper's business logic and its presentation layer, limiting flexibility for
different use cases.

### Problems with current approach

1. **Tight coupling**: Scraper logic is coupled to specific logging libraries (consola)
2. **Inflexible**: All consumers must use the same output format and verbosity
3. **Testing difficulties**: Hard to test without capturing console output
4. **Limited extensibility**: Can't easily add alternative outputs (UI progress
   bars, metrics, etc.)

### Why event emitter pattern?

An event emitter pattern allows the scraper to communicate its operations through
domain-specific events that consuming applications can listen to and handle appropriately.
Each consumer can:

- Choose which events to listen to
- Format output in their own way
- Ignore events they don't care about
- Add additional handlers (metrics, logging, UI updates, etc.)

This was implemented with domain-specific events (e.g., `generate:sections:complete`,
`upload:courses:complete`) rather than generic log-level events (info, debug, warn)
to keep events focused on what the scraper is actually doing, not how it should
be displayed.

## WHAT

### Changes to `@sneu/scraper` package

- Defines 28 strongly-typed event interfaces across 3 categories:
  - **Generate Events** (9 events):
    - `generate:start`
    - `generate:sections:complete`
    - `generate:subjects:mismatch`
    - `generate:term:complete`
    - `generate:requests:queued`
    - `generate:requests:progress`
    - `generate:complete`
    - `generate:error`
  - **Upload Events** (11 events):
    - `upload:start`
    - `upload:campuses:complete`
    - `upload:buildings:complete`
    - `upload:subjects:complete`
    - `upload:term:complete`
    - `upload:courses:complete`
    - `upload:sections:complete`
    - `upload:sections:removed`
    - `upload:meetingtimes:complete`
    - `upload:meetingtimes:removed`
    - `upload:complete`
    - `upload:error`
  - **Update Events** (8 events):
    - `update:start`
    - `update:seats:new`
    - `update:seats:waitlist`
    - `update:sections:new`
    - `update:sections:missing`
    - `update:sections:unrooted`
    - `update:complete`
    - `update:error`
- Exports `ScraperEventEmitter` interface for type safety
- Exports `createScraperEmitter()` factory function
- Removed all `consola` imports and direct logging calls
- Added export entry for `"./events"` pointing to events module

### Changes to consuming applications

**Modified: `apps/scraper-cli/src/commands/generate.ts`**

- Creates `ScraperEventEmitter` instance
- Sets up 8 event listeners that map to consola calls
- Passes emitter to `scrapeCatalogTerm()`
- Maintains same user experience with progress boxes and console output

**Modified: `apps/scraper-cli/src/commands/upload.ts`**

- Creates `ScraperEventEmitter` instance
- Sets up 11 event listeners that map to consola calls
- Passes emitter to `uploadCatalogTerm()`
- Maintains debug/info logging behavior

**Modified: `apps/searchneu/app/api/update/route.ts`**

- Creates `ScraperEventEmitter` instance
- Sets up 7 event listeners that map to console calls
- Passes emitter to `updateTerm()`
- Logs seat changes, new sections, and warnings

### Resources affected

- No infrastructure changes
- No database changes
- No external service changes
- Only internal package API changes

### Backward compatibility

The `emitter` parameter is **optional** on all three main functions. If not provided,
the scraper functions work silently without any output. This means:

- No breaking changes to existing code that doesn't use the emitter
- Can be adopted incrementally
- Safe to deploy without coordinating all consumers

## IMPLEMENTATION STEPS

1. Verify the scraper package builds successfully:

   ```bash
   cd packages/scraper && pnpm build
   ```

2. Verify TypeScript compilation for consuming apps:

   ```bash
   cd apps/scraper-cli && pnpm exec tsc --noEmit
   cd apps/searchneu && pnpm exec tsc --noEmit
   ```

3. Test scraper-cli generate command with actual term:

   ```bash
   cd apps/scraper-cli
   pnpm run scrape:gen --terms=<test-term>
   ```

   - Verify progress output appears correctly
   - Verify stats box displays
   - Verify completion messages appear

4. Test scraper-cli upload command:

   ```bash
   cd apps/scraper-cli
   pnpm run scrape:upload --terms=<test-term>
   ```

   - Verify debug output appears
   - Verify completion messages appear

5. Deploy to staging/preview environment and monitor logs:
   - Check update route logs for event output
   - Verify seat change notifications still work

6. Deploy to production:
   - Monitor error logs for any issues
   - Verify cron job update route continues to work

## ROLLBACK STEPS

If issues arise with the event emitter implementation:

### Immediate rollback (if needed)

1. **IF** scraper commands fail or produce incorrect output:
2. Revert the merge commit: `git revert <commit-sha>`
3. Create emergency PR with revert
4. Deploy revert to production
5. Verify scraper commands work as before

### Symptoms that would trigger rollback

- Scraper commands produce no output at all
- TypeScript compilation errors in consuming apps
- Missing or incorrect event data in logs
- Update route failing to detect seat changes

### Safe fallback

Because the emitter is optional, if there are issues with event handling in consuming
apps, those apps can simply **not pass an emitter** and the scraper will work silently.
This provides a safe degradation path without needing a full rollback.

### Incident declaration

If rollback is needed due to production issues (e.g., update route not detecting
seat changes), declare an incident per the incident management process.

## APPENDIX

### Example event usage

```typescript
import { createScraperEmitter } from "@sneu/scraper/events";
import { scrapeCatalogTerm } from "@sneu/scraper/generate";

const emitter = createScraperEmitter();

// Listen to events
emitter.on("generate:sections:complete", ({ count }) => {
  console.log(`Scraped ${count} sections`);
});

emitter.on("generate:requests:progress", ({ remaining, percentComplete }) => {
  console.log(`${remaining} requests remaining (${percentComplete}%)`);
});

// Call scraper with emitter
const result = await scrapeCatalogTerm(term, config, true, emitter);
```

### Event payload examples

```typescript
// Generate events
{ term: "202510" }  // generate:start
{ count: 1234 }  // generate:sections:complete
{ bannerCount: 50, extractedCount: 48, diff: ["CS"] }  // generate:subjects:mismatch

// Upload events
{ term: "202510" }  // upload:start
{ count: 500 }  // upload:courses:complete
{ count: 5, crns: ["12345", "67890"] }  // upload:sections:removed

// Update events
{ crns: ["12345", "67890"] }  // update:seats:new
{ term: "202510", sectionsWithNewSeats: 15, sectionsWithNewWaitlistSeats: 8,
   newSections: 3 }  // update:complete
```
