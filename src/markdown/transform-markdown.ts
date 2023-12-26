import { Nodes } from "npm:@types/mdast";
import { walk, WalkEntry } from "std/fs/walk.ts";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "../ast/extract-first-top-level-heading.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { transformNode } from "../ast/transform-node.ts";
import { ProjectId } from "../strings/project-id.ts";
import { createNextIdentifierNumberGetter } from "../strings/task-id-number.ts";

export async function transformMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  ast: Nodes,
  otherAstsToConsiderForIdentifierNumbers: Nodes[] = [],
): Promise<string> {
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    [ast, ...otherAstsToConsiderForIdentifierNumbers],
  );
  return await astToMarkdown(
    transformNode(
      projectId,
      nextIdentifierNumberGetter,
      ast,
    ),
  );
}

async function getInputPaths(
  directory: string,
): Promise<string[]> {
  const inputPaths: string[] = [];
  for await (
    const inputWalkEntry of walk(directory, {
      includeDirs: false,
      match: [/\.md$/],
    })
  ) {
    inputPaths.push((inputWalkEntry as WalkEntry).path);
  }
  return inputPaths;
}

async function getInputs(
  directory: string,
): Promise<Record<string, string>> {
  const inputPaths = await getInputPaths(directory);
  return Object.fromEntries(
    await Promise.all(
      inputPaths.map(async (inputPath) => [
        inputPath,
        await Deno.readTextFile(inputPath),
      ]),
    ),
  );
}

async function getInputAsts(
  directory: string,
): Promise<Record<string, Nodes>> {
  const inputs = await getInputs(directory);
  return Object.fromEntries(
    Object.entries(inputs).map(([inputPath, input]) => [
      inputPath,
      markdownToAst(input),
    ]),
  );
}

export const DELETE_FILE = Symbol("delete file");

export type TransformOutput = Record<
  string,
  string | typeof DELETE_FILE
>;

export type TransformOutputEntry = [string, string | typeof DELETE_FILE];

async function transformNodeToOutputEntries<PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumberGetter: () => number,
  inputPath: string,
  inputAst: Nodes,
): Promise<TransformOutputEntry[]> {
  const outputAst = transformNode(
    projectId,
    nextIdentifierNumberGetter,
    inputAst,
  );
  const headingString = extractFirstTopLevelHeadingString(
    outputAst,
  );
  const outputPath = headingString
    ? inputPath.replace(
      /\/([^\/]+)\.md$/,
      `/${headingString}.md`,
    )
    : inputPath;

  const output = await astToMarkdown(outputAst);
  if (inputPath === outputPath) {
    // writing to the same file
    return [
      [outputPath, output],
    ];
  } else {
    // writing to a different file, deleting the old file
    return [
      [inputPath, DELETE_FILE],
      [outputPath, output],
    ];
  }
}

export async function transformMarkdownDirectory<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  directory: string,
): Promise<TransformOutput> {
  const inputAsts: Record<string, Nodes> = await getInputAsts(directory);
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    Object.values(inputAsts),
  );

  const outputEntryPromises: Promise<TransformOutputEntry[]>[] = Object.entries(
    inputAsts,
  )
    .map(async ([inputPath, inputAst]) =>
      await transformNodeToOutputEntries(
        projectId,
        nextIdentifierNumberGetter,
        inputPath,
        inputAst,
      )
    );
  return Object.fromEntries(
    (await Promise.all(outputEntryPromises)).flat(),
  ) as TransformOutput;
}

export async function writeChanges(
  outputs: TransformOutput,
): Promise<void> {
  for (const [outputPath, output] of Object.entries(outputs)) {
    if (output === DELETE_FILE) {
      await Deno.remove(outputPath);
    } else {
      await Deno.writeTextFile(outputPath, output);
    }
  }
}
