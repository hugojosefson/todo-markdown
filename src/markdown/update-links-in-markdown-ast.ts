import { Nodes } from "npm:@types/mdast";
import { isLink, isParent } from "../ast/node-types.ts";

import { updateMarkdownLinkNode } from "./update-markdown-link-node.ts";

/**
 * Updates all links in the given markdown AST, so that they point to the correct path.
 * This function does not use {@link transformNode}, because it does not need to transform the AST in that way. Instead, it traverses the AST, and updates all links in the AST.
 * @param path The path of the markdown file that the AST is from.
 * @param ast The markdown AST to update the links in.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 */
export function updateLinksInMarkdownAst<T extends Nodes>(
  path: string,
  ast: T,
  pathUpdatesMap: Map<string, string>,
): T {
  if (isLink(ast)) {
    return updateMarkdownLinkNode(path, ast, pathUpdatesMap) as T;
  }
  if (isParent(ast)) {
    const children = ast.children.map((child) =>
      updateLinksInMarkdownAst(path, child, pathUpdatesMap)
    );
    return {
      ...ast,
      children,
    };
  }
  return ast;
}
