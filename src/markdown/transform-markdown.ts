import { Nodes } from "npm:@types/mdast";
import { walk, WalkEntry } from "std/fs/walk.ts";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "../ast/extract-first-top-level-heading.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { transformNode } from "../ast/transform-node.ts";
import { not, swallow } from "../fn.ts";
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

export async function getInputPaths(
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

export type DeleteFile = { action: "delete"; path: string };
export type WriteFile = { action: "write"; path: string; content: string };
export type DeleteOrWriteFile = DeleteFile | WriteFile;
export type UpdateLinksToFile = {
  action: "update-links";
  fromPath: string;
  toPath: string;
};

export function isDeleteFile(
  output: TransformOutputCommand,
): output is DeleteFile {
  return output.action === "delete";
}

export function isWriteFile(
  output: TransformOutputCommand,
): output is WriteFile {
  return output.action === "write";
}

export function isUpdateLinksToFile(
  output: TransformOutputCommand,
): output is UpdateLinksToFile {
  return output.action === "update-links";
}

export type TransformOutputCommand =
  | DeleteFile
  | WriteFile
  | UpdateLinksToFile;

async function transformNodeToOutputCommands<PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumberGetter: () => number,
  inputPath: string,
  inputAst: Nodes,
): Promise<TransformOutputCommand[]> {
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
      {
        action: "write",
        path: outputPath,
        content: output,
      },
    ];
  } else {
    // writing to a different file, deleting the old file
    return [
      {
        action: "delete",
        path: inputPath,
      },
      {
        action: "write",
        path: outputPath,
        content: output,
      },
    ];
  }
}

export async function transformMarkdownDirectory<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  directory: string,
): Promise<DeleteOrWriteFile[]> {
  const inputAsts: Record<string, Nodes> = await getInputAsts(directory);
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    Object.values(inputAsts),
  );

  const outputCommandsPromises: Promise<TransformOutputCommand[]>[] = Object
    .entries(
      inputAsts,
    )
    .map(async ([inputPath, inputAst]) =>
      await transformNodeToOutputCommands(
        projectId,
        nextIdentifierNumberGetter,
        inputPath,
        inputAst,
      )
    );
  const outputCommands: TransformOutputCommand[] =
    (await Promise.all(outputCommandsPromises)).flat();
  const outputCommandsWithUpdatedLinks: DeleteOrWriteFile[] = updateLinks(
    outputCommands,
  );
  return deconflictOutputCommands(outputCommandsWithUpdatedLinks);
}

/**
 * Updates links in the output commands.
 * @param outputCommands The output commands to update links in.
 * @returns The output commands with updated links.
 */
export function updateLinks(
  outputCommands: TransformOutputCommand[],
): DeleteOrWriteFile[] {
  // just filter out the update-links commands for now. TODO actually implement this
  return outputCommands.filter(not(isUpdateLinksToFile)) as DeleteOrWriteFile[];
}

/**
 * Sorts strings, and removes any duplicates.
 * @param strings The strings to sort and remove duplicates from.
 * @returns The sorted strings, with duplicates removed.
 */
export function sortUnique(strings: string[]): string[] {
  return [...(new Set(strings)).values()].sort();
}

/**
 * Takes care of collisions between output paths.
 *
 * - If two commands want to write to the same output path, and the content they want to write is the same, then it's fine. Just keep one of them.
 * - If two commands want to write to the same output path, and the content they want to write is different, then it's a collision. Concatenate the outputs, and make it only one Write.
 * - If there is one Delete and one Write to the same path, then it's a collision. Discard the Delete one, and keep the Write one.
 * @param possiblyConflictingOutputCommands The output commands to deconflict.
 * @returns The deconflicted output commands.
 */
export function deconflictOutputCommands(
  possiblyConflictingOutputCommands: DeleteOrWriteFile[],
): DeleteOrWriteFile[] {
  const outputCommands: DeleteOrWriteFile[] = [];
  const commandsByPath: Record<
    DeleteOrWriteFile["action"],
    DeleteOrWriteFile[]
  > = Object.groupBy(
    possiblyConflictingOutputCommands,
    (command) => command.path,
  );

  for (const [path, commands] of Object.entries(commandsByPath)) {
    // If there is only one command, then there is no conflict.
    if (commands.length === 1) {
      outputCommands.push(commands[0]);
      continue;
    }

    // If there are multiple commands, and they are all deletes, then there is no conflict.
    const writeCommands = commands.filter(isWriteFile);
    if (writeCommands.length === 0) {
      outputCommands.push(commands[0]);
      continue;
    }

    // We are writing to the file
    const contents = writeCommands.map((command) => command.content);
    const content = sortUnique(contents).join("\n");
    outputCommands.push({
      action: "write",
      path,
      content,
    });
  }

  return outputCommands;
}

export async function writeChanges(
  outputs: DeleteOrWriteFile[],
): Promise<void> {
  for (const command of outputs) {
    if (isDeleteFile(command)) {
      await Deno.remove(command.path).catch(swallow(Deno.errors.NotFound));
    } else {
      await Deno.writeTextFile(command.path, command.content);
    }
  }
}
