import { generateFiles } from "fumadocs-openapi";
import pino from "pino";

const logger = pino();

void main().catch(logger.error);
async function main() {
  const input = [
    "https://raw.githubusercontent.com/sandboxnu/search2/refs/heads/main/content/api/banner-openapi.yaml",
  ];
  const output = "./content/docs/banner-api";

  await generateFiles({
    input: input,
    output: output,
    includeDescription: true,
    per: "operation",
    groupBy: "tag",
  });
}
