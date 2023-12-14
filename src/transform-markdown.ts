import { Root } from "npm:mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { formatCode } from "./format-code.ts";
import { markdownToAst } from "./markdown-to-ast.ts";
import { transformAst } from "./transform-ast.ts";

export async function transformMarkdown(markdown: string): Promise<string> {
  const oldAst: Root = markdownToAst(markdown);

  const newAst: Root = transformAst(oldAst);

  return await formatCode(
    "md",
    toMarkdown(newAst, { extensions: [gfmToMarkdown()] }),
  );
}
