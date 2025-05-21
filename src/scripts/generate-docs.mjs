import { generateFiles } from "fumadocs-openapi";
import fs from "fs/promises";
import path from "path";

const exceptions = ["meta.json", "index.md"];

main().catch(console.error);

async function main() {
  await doBannerSpec();
}

// doBannerSpec generates the files for the Banner OpenAPI spec
async function doBannerSpec() {
  const input = ["./content/api/banner-openapi.yaml"];
  const output = "./content/docs/banner-api";

  await cleanOutput(output);

  await generateFiles({
    input: input,
    output: output,
    includeDescription: true,
    per: "operation",
    groupBy: "tag",
  });

  await unnestDirectories(output);
}

// cleanOutput removes all the generated files from the generated content/docs/api
// directory, leaving the meta.json configuration file
async function cleanOutput(output) {
  await fs.access(output);

  const items = await fs.readdir(output);

  for (const item of items) {
    if (exceptions.indexOf(item) < 0) {
      const itemPath = path.join(output, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        await fs.rm(itemPath, { recursive: true });
      } else {
        await fs.unlink(itemPath);
      }
    }
  }

  console.log("Output directory cleaned");
}

// unnestDirectories removes the directory nesting that fumadocs openapi generates by default
// leaving the routes grouped only by tag instead
async function unnestDirectories(output) {
  const items = await fs.readdir(output);

  for (const item of items) {
    if (exceptions.indexOf(item) > -1) continue;

    const dirPath = path.join(output, item);
    const dirs = await fs.readdir(dirPath);

    for (const dir of dirs) {
      const itemPath = path.join(dirPath, dir);
      const items = await fs.readdir(itemPath);

      for (const item of items) {
        const filePath = path.join(itemPath, item);

        const newName = `${dir}-${item}`;
        const newPath = path.join(dirPath, newName);

        await fs.rename(filePath, newPath);
        console.log(`Moved: ${itemPath} -> ${newPath}`);
      }

      await fs.rm(itemPath, { recursive: true });
    }
  }

  console.log("Unnesting completed successfully");
}
