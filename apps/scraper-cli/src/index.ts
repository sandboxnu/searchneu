#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "scraper",
    description: "SearchNEU scraper CLI",
  },
  subCommands: {
    generate: () => import("./commands/generate.js").then((m) => m.default),
    upload: () => import("./commands/upload.js").then((m) => m.default),
  },
});

void runMain(main);
