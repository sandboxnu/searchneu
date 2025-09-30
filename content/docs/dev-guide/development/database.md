---
title: Database
description: Local database setup
---

## Database

For development a local database can be spin up allowing db changes to be made
without fear of affecting the prod systems.

First, ensure that Docker is installed on your machine. This varies from system
to system but the most up to date instruction can be found on the Docker website.
In the root of the project, run `docker compose up -d`; this will spin up the local
db container and a proxy allowing us to use the same driver as the prod database.

Once the local database is spun up, it needs to first have the schema applied by
running `pnpm db:push`. The database then needs data to be added from a scrape
[TODO THAT].
