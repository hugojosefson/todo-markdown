import { deconflictOutputCommands } from "../markdown/deconflict-output-commands.ts";
import { updateLinksInOutputCommands } from "../markdown/update-links-in-output-commands.ts";
import { InputAsts } from "../model/input-asts.ts";
import { DeleteOrWriteFile, OutputCommand } from "../model/output-command.ts";
import { ProjectId } from "../model/project-id.ts";
import { createNextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { transformInputAstToOutputCommands } from "./transform-input-ast-to-output-commands.ts";
import { updateTocInOutputCommands } from "./update-toc-in-output-commands.ts";

/**
 * Transforms multiple input ASTs from a directory, and outputs the result as {@link DeleteOrWriteFile} commands.
 * @param projectId The project ID to use for identifying and generating task IDs.
 * @param basePath The base path to use as root, for relative paths.
 * @param inputAsts The input ASTs to transform.
 */
export async function transformInputAstsToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  basePath: string,
  inputAsts: InputAsts,
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
      await transformInputAstToOutputCommands(
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
  const deconflictedOutputCommands = deconflictOutputCommands(
    outputCommandsWithUpdatedLinks,
  );
  return await updateTocInOutputCommands(
    basePath,
    deconflictedOutputCommands,
  );
}
