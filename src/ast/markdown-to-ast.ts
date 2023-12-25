import { Nodes } from "npm:@types/mdast";
import { fromMarkdown } from "npm:mdast-util-from-markdown";
import { gfmFromMarkdown } from "npm:mdast-util-gfm";
import { gfm } from "npm:micromark-extension-gfm";
import * as R from "npm:ramda";

/**
 * Clone an object, excluding "position" properties
 */
const cloneWithoutPosition = R.compose(R.omit(["position"]), R.clone);

/**
 * Clone an AST, excluding "position" properties
 */
export function removePosition(node: unknown) {
  if (R.is(Array, node)) {
    return R.map(removePosition, node);
  }
  if (R.is(Object, node)) {
    return R.map(removePosition, cloneWithoutPosition(node));
  }
  return node;
}

export function markdownToAst(markdown: string): Nodes {
  const ast = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  return removePosition(ast);
}

// read from Deno.stdin, console.log the result
if (import.meta.main) {
  const inputMarkdown = await Deno.readTextFile("/dev/stdin");
  const ast = markdownToAst(inputMarkdown);
  const output = JSON.stringify(ast, null, 2);
  console.log(output);
}
