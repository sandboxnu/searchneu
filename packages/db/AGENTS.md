# @sneu/db

Drizzle schema and DB clients. Exposes `@sneu/db/pg` (local `pg`),
`@sneu/db/neon` (remote serverless), and `@sneu/db/schema`.

- Edit the schema, then run `turbo db:generate` to create a migration and
  `turbo db:migrate` to apply it. Never hand-edit generated migrations.
- `turbo db:push` (no migration) and `turbo db:studio` are available for local work.
