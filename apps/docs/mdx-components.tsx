import * as Twoslash from "fumadocs-twoslash/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { BannerAPIPage, SearchNeuAPIPage } from "./components/api-page";
import { Diagram } from "./components/diagram";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    APIPage: BannerAPIPage,
    SearchNeuAPIPage,
    Diagram,
    ...Twoslash,
    ...components,
  };
}
