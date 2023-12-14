import { formatCode } from "./format-code.ts";
import { Nodes } from "npm:@types/mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";

export async function astToMarkdown(ast: Nodes): Promise<string> {
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
