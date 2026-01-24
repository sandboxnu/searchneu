import { generateFiles } from "fumadocs-openapi";
import { bannerOpenapi, searchneuOpenapi } from "@/lib/openapi";

void generateFiles({
  input: bannerOpenapi,
  output: "./content/banner",
  per: "operation",
  groupBy: "tag",
  // we recommend to enable it
  // make sure your endpoint description doesn't break MDX syntax.
  includeDescription: true,
});

void generateFiles({
  input: searchneuOpenapi,
  output: "./content/searchneu",
  per: "operation",
  groupBy: "tag",
  // we recommend to enable it
  // make sure your endpoint description doesn't break MDX syntax.
  includeDescription: true,
});
