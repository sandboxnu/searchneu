import { scrapeTerm } from "@/scraper/scrape";
import { Config } from "@/scraper/types";
import { existsSync, readFileSync, writeFile } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const CACHE_PATH = "cache/";
const CACHE_FORMAT = (term: string) => `term-${term}.json`;

void (async () => {
  const configStream = readFileSync(path.resolve(CACHE_PATH, "manifest.yaml"), {
    encoding: "utf8",
  });
  const config = parse(configStream) as Config;

  for (const term of config.terms) {
    const cachename = path.resolve(
      CACHE_PATH,
      CACHE_FORMAT(term.term.toString()),
    );
    const existingCache = existsSync(cachename);

    if (existingCache) {
      console.log("cache already exists");
      continue;
    }

    const out = await scrapeTerm(term.term.toString(), config);
    writeFile(cachename, JSON.stringify(out), (err) => {
      if (err) console.log(err);
    });
  }
})();
