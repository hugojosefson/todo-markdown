import { Nodes } from "npm:@types/mdast";
import { gfmToMarkdown } from "npm:mdast-util-gfm";
import { toMarkdown } from "npm:mdast-util-to-markdown";
import { ProjectId } from "../strings/project-id.ts";
import { formatCode } from "./format-code.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { mutateAst } from "../ast/mutate-ast.ts";

export async function transformMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  markdown: string,
): Promise<string> {
  const ast: Nodes = markdownToAst(markdown);
  mutateAst(projectId, ast);
  const transformedMarkdown = toMarkdown(ast, {
    extensions: [gfmToMarkdown()],
  });
  return await formatCode("md", transformedMarkdown);
}
