import { Node, Nodes } from "npm:@types/mdast";
import { fromMarkdown } from "npm:mdast-util-from-markdown";
import { gfmFromMarkdown } from "npm:mdast-util-gfm";
import { gfm } from "npm:micromark-extension-gfm";
import * as R from "npm:ramda";
import { readAllFromStdin } from "../io/read-all-from-stdin.ts";

/**
 * Converts the given Markdown to an AST, without any `position` properties.
 * @param markdown The Markdown to convert to an AST.
 * @returns The given Markdown converted to an AST.
 */
export function markdownToAst(markdown: string): Nodes {
  const ast = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  return removePosition(ast);
}

/**
 * Clone an object, excluding "position" properties
 */
const cloneWithoutPosition: <T extends Node>(ast: T) => Omit<T, "position"> = R
  .compose(R.omit(["position"]), R.clone);

/**
 * Clone an AST, excluding "position" properties
 */
export function removePosition<T extends Node>(node: T): Omit<T, "position"> {
  if (R.is(Array, node)) {
    return R.map(removePosition, node);
  }
  if (R.is(Object, node)) {
    return R.map(removePosition, cloneWithoutPosition(node));
  }
  return node;
}

// read from Deno.stdin, console.log the result
if (import.meta.main) {
  const inputMarkdown = await readAllFromStdin();
  const ast = markdownToAst(inputMarkdown);
  const output = JSON.stringify(ast, null, 2);
  console.log(output);
}
