import { generateFiles } from "fumadocs-openapi";
import { authOpenapi, bannerOpenapi, searchneuOpenapi } from "@/lib/openapi";

void generateFiles({
  input: bannerOpenapi,
  output: "./content/banner",
  per: "operation",
  groupBy: "tag",
  includeDescription: true,
});

void generateFiles({
  input: searchneuOpenapi,
  output: "./content/searchneu",
  per: "operation",
  groupBy: "tag",
  includeDescription: true,
});

void generateFiles({
  input: authOpenapi,
  output: "./content/auth",
  per: "operation",
  groupBy: "none",
  includeDescription: true,
});
