import * as React from "react";
import ReactMarkdown from "react-markdown";
import { useExplanationsInText } from "@/hooks/use-explanations";
import { wrapKeywordsInText } from "@/components/BibleExplanationTooltip";

interface Props {
  text: string;
  /** Optional decorators that run on each text node (e.g. makeRefsClickable, splitCitationSource) */
  decorate?: (node: React.ReactNode) => React.ReactNode;
}

/**
 * Wraps the assistant text and decorates matched Bible-explanation keywords
 * with a hover tooltip. Decorators (citation linking etc.) still apply.
 */
export function AssistantMessageBody({ text, decorate }: Props) {
  const { data: matches = [] } = useExplanationsInText(text);

  const processChildren = React.useCallback(
    (children: React.ReactNode): React.ReactNode => {
      const wrapped = React.Children.map(children, (child) => {
        if (typeof child === "string" && matches.length > 0) {
          return wrapKeywordsInText(child, matches);
        }
        return child;
      });
      return decorate ? decorate(wrapped) : wrapped;
    },
    [matches, decorate],
  );

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p>{processChildren(children)}</p>,
        li: ({ children }) => <li>{processChildren(children)}</li>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
