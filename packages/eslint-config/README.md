# @sneu/eslint-config

Shared ESLint configuration for the Search NEU monorepo

## Configurations

### `base.js`

Base configuration with TypeScript support, recommended for all TypeScript packages:

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- Popular rules: consistent-type-imports, no-console warnings, prefer-const,
  curly braces

### `next.js`

Configuration for Next.js applications, extends base config with Next.js-specific
rules:

- All base rules
- Next.js core-web-vitals
- Next.js TypeScript rules

## Usage

### TypeScript Packages

In your package.json:

```json
{
  "scripts": {
    "lint": "eslint ."
  },
  "devDependencies": {
    "@sneu/eslint-config": "workspace:*",
    "eslint": "^9.39.2"
  }
}
```

Create `eslint.config.mjs`:

```js
import { config } from "@sneu/eslint-config/base";

export default [...config];
```

### Next.js Apps

In your package.json:

```json
{
  "scripts": {
    "lint": "eslint ."
  },
  "devDependencies": {
    "@sneu/eslint-config": "workspace:*",
    "eslint": "^9.39.2"
  }
}
```

Create `eslint.config.mjs`:

```js
import { config } from "@sneu/eslint-config/next-js";

export default [...config];
```
