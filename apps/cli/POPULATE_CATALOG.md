# populate-catalog

Populates the `catalog_majors` and `catalog_minors` database tables from the output of the [major-scraper](https://github.com/sandboxnu/major-scraper) repo.

## Prerequisites

1. **Clone the major-scraper repo** somewhere on your machine:

   ```sh
   git clone https://github.com/sandboxnu/major-scraper ~/Documents/major-scraper
   cd ~/Documents/major-scraper
   pnpm install
   ```

2. **Set `DATABASE_URL`** in `apps/cli/.env` (the CLI reads it automatically):

   ```
   DATABASE_URL=postgres://user:pass@host:5432/dbname
   ```

3. **Run any pending DB migrations** so the schema is up to date:
   ```sh
   cd packages/db
   npm run db:push
   ```

## Usage

Run from the **repo root**:

```sh
# Scrape + insert (default: current catalog year)
pnpm --filter @sneu/cli cli tools populate-catalog --scraperPath ~/Documents/major-scraper

# Skip the scrape step and just re-insert from existing scraper output
pnpm --filter @sneu/cli cli tools populate-catalog --scraperPath ~/Documents/major-scraper --skipScrape

# Scrape specific years
pnpm --filter @sneu/cli cli tools populate-catalog --scraperPath ~/Documents/major-scraper --years 2024,2025

# Verbose output (shows each major/minor + template matches)
pnpm --filter @sneu/cli cli tools populate-catalog --scraperPath ~/Documents/major-scraper -v
```

Or from `apps/cli/` directly:

```sh
cd apps/cli
npm run cli -- tools populate-catalog --scraperPath ~/Documents/major-scraper
```

## Options

| Flag                 | Type    | Default      | Description                                                      |
| -------------------- | ------- | ------------ | ---------------------------------------------------------------- |
| `--scraperPath`      | string  | _(required)_ | Path to the cloned major-scraper repo                            |
| `--years`            | string  | `"current"`  | Comma-separated catalog years to scrape (e.g. `2024,2025`)       |
| `--skipScrape`, `-s` | boolean | `false`      | Skip running the scraper; just read existing output files        |
| `--verbose`, `-v`    | boolean | `false`      | Print each major/minor name and template match as it's processed |

## What it does

1. **Validates** the `--scraperPath` points to a directory with a `package.json`.
2. **Runs the scraper** (`pnpm scrape:all <years>`) inside the major-scraper repo, unless `--skipScrape` is set.
3. **Reads parsed major files** from `degrees/major/{year}/{college}/{name}/parsed.initial.json`.
4. **Looks up matching templates** at `templates/{year}/{college}/{name}/template.json` and stores them as `templateOptions`.
5. **Reads parsed minor files** from `degrees/minor/{year}/{college}/{name}/parsed.initial.json`.
6. **Batch-inserts** all rows into `catalog_majors` and `catalog_minors`.

### Columns populated

**catalog_majors:**

- `name`, `totalCreditsRequired`, `yearVersion`, `requirementSections`
- `concentrationOptions` — array of concentration `Section` objects
- `minConcentrationOptions` — minimum number of concentrations required (from `concentrations.minOptions`)
- `templateOptions` — template JSON (empty `{}` if no template exists)

**catalog_minors:**

- `name`, `totalCreditsRequired`, `yearVersion`, `requirementSections`
- `concentrationOptions`

## Re-populating

The command performs plain `INSERT` operations. If you need to refresh the data, truncate the tables first:

```sql
TRUNCATE catalog_majors, catalog_minors;
```

Then re-run the command.
