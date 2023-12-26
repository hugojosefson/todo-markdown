import { walk, WalkEntry } from "std/fs/walk.ts";
import { Nodes } from "npm:@types/mdast";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { replaceNode } from "../ast/replace-node.ts";
import { ProjectId } from "../strings/project-id.ts";
import { createNextIdentifierNumberGetter } from "../strings/task-id-number.ts";

export async function transformMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  markdown: string,
  otherMarkdownToConsiderForIdentifierNumbers: string[] = [],
): Promise<string> {
  const ast: Nodes = markdownToAst(markdown);
  const otherAsts: Nodes[] = otherMarkdownToConsiderForIdentifierNumbers.map(
    markdownToAst,
  );
  return await astToMarkdown(
    replaceNode(
      projectId,
      createNextIdentifierNumberGetter(projectId, [ast, ...otherAsts]),
      ast,
    ),
  );
}

export async function transformMarkdownDirectory<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  directory: string,
  writeFiles = false,
): Promise<Record<string, string>> {
  const inputs: Record<string, string> = {};
  const inputAsts: Record<string, Nodes> = {};
  for await (
    const inputWalkEntry of walk(directory, {
      includeDirs: false,
      match: [/\.md$/],
    })
  ) {
    const inputPath = (inputWalkEntry as WalkEntry).path;
    const input = await Deno.readTextFile(inputPath);
    inputs[inputPath] = input;
    inputAsts[inputPath] = markdownToAst(input);
  }

  const outputs: Record<string, string> = {};
  for (
    const [inputPath, input] of Object.entries(inputs)
  ) {
    const output = await transformMarkdown(
      projectId,
      input,
      Object.values(inputs),
    );
    inputAsts[inputPath] = markdownToAst(input);
    outputs[inputPath] = output;
    if (writeFiles) {
      await Deno.writeTextFile(inputPath, output);
    }
  }
  return outputs;
}
