import { generateFiles } from "fumadocs-openapi";

void main().catch(console.error);

async function main() {
  const input = ["./content/api/banner-openapi.yaml"];
  const output = "./content/docs/banner-api";

  await generateFiles({
    input: input,
    output: output,
    includeDescription: true,
    per: "operation",
    groupBy: "none",
  });
}
