import { formatCode } from "../markdown/format-code.ts";
import { Nodes, Root, RootContent } from "npm:@types/mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";

/**
 * Converts the given AST to Markdown.
 * @param ast The AST to convert to Markdown.
 * @returns The given AST converted to Markdown.
 */
export async function astToMarkdown(
  ast: Nodes | RootContent[],
): Promise<string> {
  if (Array.isArray(ast)) {
    ast = root(ast);
  }

  const markdown: string = toMarkdown(
    ast,
    {
      extensions: [
        gfmToMarkdown(),
      ],
    },
  );
  return await formatCode("md", markdown);
}

export function root(
  children: RootContent[],
): Root {
  return {
    type: "root",
    children,
  };
}
