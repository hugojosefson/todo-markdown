import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { DeleteOrWriteFile, isWriteFile } from "../model/output-command.ts";
import { sortUnique } from "../strings/sort-unique.ts";

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
      ast: markdownToAst(content),
    });
  }

  return outputCommands;
}
