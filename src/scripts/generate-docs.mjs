import { generateFiles } from "fumadocs-openapi";

// TODO: Not sure what to change this to
void main().catch(console.error);

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
