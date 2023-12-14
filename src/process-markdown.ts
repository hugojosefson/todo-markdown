import { Root } from "npm:mdast";
import { fromMarkdown } from "npm:mdast-util-from-markdown";
import { gfmFromMarkdown, gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { gfm } from "npm:micromark-extension-gfm";
import { formatCode } from "./format-code.ts";
import { transformAst } from "./transform-ast.ts";

export async function processMarkdown(markdown: string): Promise<string> {
  const oldAst: Root = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  const newAst: Root = transformAst(oldAst);

  const out = toMarkdown(newAst, { extensions: [gfmToMarkdown()] });
  return await formatCode("md", out);
}
