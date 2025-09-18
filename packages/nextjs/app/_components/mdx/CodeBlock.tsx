"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  "data-language"?: string;
  "data-theme"?: string;
}

export const CodeBlock = ({ children, className = "", ...props }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  // Extract language from className (e.g., "language-typescript" -> "typescript")
  const languageMatch = className?.match(/language-(\w+)/);
  const language = props["data-language"] || languageMatch?.[1] || "";

  // Extract text content for copying
  const getTextContent = (element: React.ReactNode): string => {
    if (typeof element === "string") return element;
    if (typeof element === "number") return element.toString();
    if (Array.isArray(element)) return element.map(getTextContent).join("");
    if (element && typeof element === "object" && "props" in element) {
      const props = element.props as { children?: React.ReactNode };
      if (props.children) {
        return getTextContent(props.children);
      }
    }
    return "";
  };

  const handleCopy = async () => {
    const text = getTextContent(children);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Get the code text content
  const codeText = getTextContent(children);

  // Language mapping for better syntax highlighting
  const getLanguage = (lang: string) => {
    const langMap: { [key: string]: string } = {
      js: "javascript",
      ts: "typescript",
      tsx: "typescript",
      jsx: "javascript",
      sh: "bash",
      shell: "bash",
      yml: "yaml",
      md: "markdown",
    };
    return langMap[lang] || lang;
  };

  const highlightLanguage = getLanguage(language);

  // If there's no language, render a simple pre block with dark background
  if (!language) {
    return (
      <pre
        className={`${className} overflow-x-auto bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4`}
        style={{
          fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
          fontSize: "0.75rem",
          lineHeight: "1.5",
        }}
        {...props}
      >
        {children}
      </pre>
    );
  }

  return (
    <div className="relative group not-prose">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">{language}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-700 rounded"
          title="Copy code"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-400" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4 text-gray-300" />
          )}
        </button>
      </div>

      {/* Code content with syntax highlighting */}
      <SyntaxHighlighter
        language={highlightLanguage}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
          fontSize: "0.75rem",
          lineHeight: "1.5",
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};
