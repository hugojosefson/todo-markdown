import { formatCode } from "./format-code.ts";
import { Root } from "npm:mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { markdownToAst } from "./markdown-to-ast";

export async function astToMarkdown(ast: Root): Promise<string> {
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
