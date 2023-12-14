import { Nodes } from "npm:@types/mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { formatCode } from "./format-code.ts";
import { markdownToAst } from "./markdown-to-ast.ts";
import { transformAst } from "./transform-ast.ts";

export async function transformMarkdown(markdown: string): Promise<string> {
  const oldAst: Nodes = markdownToAst(markdown);

  const newAst: Nodes = transformAst(oldAst);
  console.error(JSON.stringify(newAst, null, 2));

  return await formatCode(
    "md",
    toMarkdown(newAst, { extensions: [gfmToMarkdown()] }),
  );
}
