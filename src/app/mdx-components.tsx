import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { APIPage } from "fumadocs-openapi/ui";
import { openapi } from "@/lib/source";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    APIPage: (props) => {
      const oapiProps = openapi.getAPIPageProps(props);

      console.log(oapiProps);

      return <APIPage {...oapiProps} />;
    },
    Popup,
    PopupContent,
    PopupTrigger,
    // HTML `ref` attribute conflicts with `forwardRef`
    pre: ({ ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    ...components,
  };
}
