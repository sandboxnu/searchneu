---
title: Scraping
description: Course data scraping and database upload
---

## Overview

The scraper fetches course data from NEU Banner and stores it in JSON cache files. These cache files can then be uploaded to the database.

## Commands

### Generate Cache (`scrape:gen`)

Scrapes course data from NEU Banner and generates/updates cache files.

```bash
# Scrape active terms only (default)
npm run scrape:gen

# Scrape all terms regardless of activeUntil date
npm run scrape:gen -- --all

# Scrape specific terms
npm run scrape:gen -- --terms 202610,202630

# Show help
npm run scrape:gen -- --help
```

**Behavior:**
- By default, only scrapes terms that are active (before their `activeUntil` date in `manifest.yaml`)
- Always regenerates/updates existing cache files to reflect the latest state
- Stores raw campus codes and nupath attributes from Banner
- Adds a timestamp to each cache file indicating when it was generated

### Upload to Database (`scrape:up`)

Uploads cached course data to the database.

```bash
# Upload active terms only (default)
npm run scrape:up

# Upload all terms regardless of activeUntil date
npm run scrape:up -- --all

# Upload specific terms
npm run scrape:up -- --terms 202610,202630

# Show help
npm run scrape:up -- --help
```

**Behavior:**
- By default, only uploads terms that are active (before their `activeUntil` date)
- Validates campus codes against the configuration before uploading
- Filters nupath attributes to only include those defined in the configuration
- Applies campus name transformations during upload (not during scraping)
- Will error if a campus code doesn't exist in the configuration

## Configuration

Course data configuration is defined in `cache/manifest.yaml`:

```yaml
terms:
  - term: 202610
    activeUntil: 2025-10-01
  - term: 202630
    activeUntil: 2026-02-01

attributes:
  campus:
    - code: "Boston"
      group: "United States"
    - code: "Oakland, CA"
      name: "Oakland"
      group: "United States"
  
  nupath:
    - code: "NUpath Natural/Designed World"
      short: "ND"
      name: "Natural/Designed World"
```

### Terms

Each term has:
- `term`: The term code (e.g., 202610)
- `activeUntil`: Date until which the term is considered active

### Attributes

#### Campus
- `code`: The exact campus description from Banner (required)
- `name`: Display name to use in the database (optional, defaults to code)
- `group`: Campus grouping (e.g., "United States", "Canada")

#### NUPath
- `code`: Full nupath name from Banner
- `short`: Short code (e.g., "ND", "EI")
- `name`: Display name

## Cache Files

Cache files are stored in `cache/term-{termCode}.json` with the following structure:

```json
{
  "term": {
    "code": "202610",
    "description": "Fall 2025 Semester"
  },
  "courses": [...],
  "subjects": [...],
  "rooms": {...},
  "buildingCampuses": {...},
  "timestamp": "2025-10-24T19:00:00.000Z"
}
```

The `timestamp` field indicates when the cache was last generated.

## Workflow

1. **Configure terms**: Update `cache/manifest.yaml` with desired terms
2. **Generate cache**: Run `npm run scrape:gen` to fetch and cache data
3. **Upload to database**: Run `npm run scrape:up` to upload cached data

## Error Handling

### Invalid Campus Code

If the scraper encounters a campus code that doesn't exist in the configuration during upload:

```
❌ Invalid campus code: "New Campus". Campus not found in config. 
   Please add this campus to manifest.yaml before uploading.
```

**Solution**: Add the missing campus to `cache/manifest.yaml`:

```yaml
attributes:
  campus:
    - code: "New Campus"
      name: "New Campus"
      group: "United States"
```

### Missing Cache File

If you try to upload a term that hasn't been scraped:

```
❌ Missing cache files for terms: 202640
   Run 'npm run scrape:gen' to generate cache files first
```

**Solution**: Generate the cache file first with `npm run scrape:gen`.
