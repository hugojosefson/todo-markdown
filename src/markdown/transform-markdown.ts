import { walk, WalkEntry } from "std/fs/walk.ts";
import { Nodes } from "npm:@types/mdast";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "../ast/extract-first-top-level-heading.ts";
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
    const inputAst = markdownToAst(input);
    inputAsts[inputPath] = inputAst;
    const headingString = extractFirstTopLevelHeadingString(inputAst);
    const outputPath = headingString
      ? inputPath.replace(
        /\/([^\/]+)\.md$/,
        `/${headingString}.md`,
      )
      : inputPath;
    outputs[outputPath] = output;
    if (writeFiles) {
      if (inputPath !== outputPath) {
        await Deno.remove(inputPath);
      }
      await Deno.writeTextFile(outputPath, output);
    }
  }
  return outputs;
}
