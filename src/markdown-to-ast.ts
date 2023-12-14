import { Root } from "npm:mdast";
import { fromMarkdown } from "npm:mdast-util-from-markdown";
import { gfmFromMarkdown } from "npm:mdast-util-gfm";
import { gfm } from "npm:micromark-extension-gfm";

export function markdownToAst(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}
