import { Nodes } from "npm:@types/mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import {
  generateNextIdentifierNumber,
  replaceNode,
} from "../ast/replace-ast.ts";
import { ProjectId } from "../strings/project-id.ts";
import { formatCode } from "./format-code.ts";

export async function transformMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  markdown: string,
): Promise<string> {
  const ast: Nodes = markdownToAst(markdown);
  const transformedMarkdown = toMarkdown(
    replaceNode(
      projectId,
      generateNextIdentifierNumber(projectId, ast),
      ast,
    ),
    {
      extensions: [gfmToMarkdown()],
    },
  );
  return await formatCode("md", transformedMarkdown);
}
