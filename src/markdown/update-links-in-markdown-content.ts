import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";

import { updateLinksInMarkdownAst } from "./update-links-in-markdown-ast.ts";

/**
 * Updates all links in the given markdown content, so that they point to the correct path.
 * Uses {@link markdownToAst} to parse the markdown content into an AST, and then uses {@link updateLinksInMarkdownAst}
 * to update the links in the AST, and then uses {@link astToMarkdown} to convert the AST back into markdown content.
 * @param path The path of the markdown file that the content is from.
 * @param content The markdown content to update the links in.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 */
export async function updateLinksInMarkdownContent(
  path: string,
  content: string,
  pathUpdatesMap: Map<string, string>,
): Promise<string> {
  const ast = markdownToAst(content);
  const updatedAst = updateLinksInMarkdownAst(path, ast, pathUpdatesMap);
  return await astToMarkdown(updatedAst);
}
