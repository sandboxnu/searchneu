import { scrapeTerm } from "./scrape";
import { writeFile } from "node:fs";

const TERM = "202610";

async function main() {
  const now = new Date();
  const cachename = `scrape-${TERM}-${now.toISOString()}.json`;

  console.log("generating new scrape ", now.toISOString());
  const term = await scrapeTerm(TERM);

  writeFile(cachename, JSON.stringify(term), (err) => {
    if (err) console.log(err);
  });
}

(async function loop() {
  setTimeout(() => {
    try {
      main();
    } catch (e) {
      console.error(e);
    }

    loop();
  }, 600_000); // every 10 minutes
});
