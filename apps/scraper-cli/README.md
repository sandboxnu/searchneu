# SearchNEU Scraper CLI

CLI application for scraping course data from Banner and uploading to the database.

## Commands

### Generate Cache Files

Scrapes course data from Banner and generates cache files:

```bash
pnpm scrape:gen [options]
```

**Options:**

- `--terms` - Comma-separated list of terms, 'active' (default), or 'all'
- `--cachePath` - Path to cache directory (default: 'cache/')
- `--interactive`, `-i` - Enable interactive mode with progress updates
- `--overwrite`, `-f` - Overwrite existing cache files
- `--verbose`, `-v` - Enable verbose logging
- `--veryverbose`, `-vv` - Enable very verbose logging

**Examples:**

```bash
# Scrape active terms
pnpm scrape:gen

# Scrape specific terms
pnpm scrape:gen --terms 202510,202520

# Interactive mode with overwrite
pnpm scrape:gen -i -f
```

### Upload Cache Files

Uploads cached course data to the database:

```bash
pnpm scrape:up [options]
```

**Options:**

- `--terms` - Comma-separated list of terms, 'active' (default), or 'all'
- `--cachePath` - Path to cache directory (default: 'cache/')
- `--interactive`, `-i` - Enable interactive mode
- `--verbose`, `-v` - Enable verbose logging
- `--veryverbose`, `-vv` - Enable very verbose logging

**Examples:**

```bash
# Upload active terms
pnpm scrape:up

# Upload specific terms
pnpm scrape:up --terms 202510
```
