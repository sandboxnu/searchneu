import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { APIPage } from "fumadocs-openapi/ui";
import { openapi } from "@/lib/source";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { readFileSync } from "fs";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    APIPage: (props) => {
      const oapiProps = openapi.getAPIPageProps(props);

      const path = oapiProps.document;

      const file = readFileSync(path);
      const size = file.byteLength;

      console.log(size);

      return (
        <div>
          <pre>size: {size}B</pre>
          <pre>{JSON.stringify(oapiProps, null, 2)}</pre>
          <APIPage {...oapiProps} />
        </div>
      );
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
