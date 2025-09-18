import { CodeBlock } from "./CodeBlock";
import { Mermaid } from "~~/components/Mermaid";

// Custom pre component that extracts language from nested code element
const Pre = (props: any) => {
  const { children, ...rest } = props;

  // Check if children contains a code element with a className
  if (children && typeof children === "object" && children.props) {
    const { className, children: codeChildren } = children.props;
    if (className && className.includes("language-")) {
      // Handle mermaid diagrams
      if (className.includes("language-mermaid")) {
        return <Mermaid chart={codeChildren} />;
      }
      return (
        <CodeBlock className={className} {...rest}>
          {codeChildren}
        </CodeBlock>
      );
    }
  }

  // Fallback to CodeBlock for all pre elements
  return <CodeBlock {...props} />;
};

// MDX Components for enhanced rendering
export const mdxComponents = {
  pre: Pre,
  // You can add more custom components here
  // h1: (props: any) => <h1 className="custom-h1" {...props} />,
  // h2: (props: any) => <h2 className="custom-h2" {...props} />,
};
