import { Nodes } from "npm:@types/mdast";
import { DeleteOrWriteFile, OutputCommand } from "../model/output-command.ts";
import { ProjectId } from "../model/project-id.ts";
import { createNextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { deconflictOutputCommands } from "./deconflict-output-commands.ts";
import { transformNodeToOutputCommands } from "./transform-node-to-output-commands.ts";
import { updateLinksInOutputCommands } from "./update-links-in-output-commands.ts";

/**
 * Transforms multiple input ASTs from a directory, and outputs the result as {@link DeleteOrWriteFile} commands.
 * @param projectId The project ID to use for identifying and generating task IDs.
 * @param inputAsts The input ASTs to transform.
 */
export async function transformAstsToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  inputAsts: Record<string, Nodes>,
): Promise<DeleteOrWriteFile[]> {
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    Object.values(inputAsts),
  );

  const outputCommandsPromises: Promise<OutputCommand[]>[] = Object
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
  const outputCommands: OutputCommand[] =
    (await Promise.all(outputCommandsPromises)).flat();
  const outputCommandsWithUpdatedLinks: DeleteOrWriteFile[] =
    await updateLinksInOutputCommands(
      outputCommands,
    );
  return deconflictOutputCommands(outputCommandsWithUpdatedLinks);
}
