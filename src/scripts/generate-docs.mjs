import { generateFiles } from "fumadocs-openapi";

void main().catch((err) => {
  logger.error({ err }, "Fatal error");
  process.exitCode = 1;
});

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
