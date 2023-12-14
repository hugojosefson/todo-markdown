import { Nodes } from "npm:@types/mdast";
import { fromMarkdown } from "npm:mdast-util-from-markdown";
import { gfmFromMarkdown } from "npm:mdast-util-gfm";
import { gfm } from "npm:micromark-extension-gfm";

export function markdownToAst(markdown: string): Nodes {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}
