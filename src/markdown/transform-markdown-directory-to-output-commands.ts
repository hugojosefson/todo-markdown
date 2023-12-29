import { Nodes } from "npm:@types/mdast";
import { DeleteOrWriteFile } from "../commands/output-command.ts";
import { pipeAsync3 } from "../fn.ts";
import { getMarkdownFilePathsInDirectory } from "../io/get-markdown-file-paths-in-directory.ts";
import { readTextFilesToInputs } from "../io/read-text-files-to-inputs.ts";
import { ProjectId } from "../strings/project-id.ts";
import { inputsToInputAsts } from "./inputs-to-input-asts.ts";

import { transformAstsToOutputCommands } from "./transform-asts-to-output-commands.ts";

/**
 * Transforms all markdown files in the given directory, and outputs the result as {@link DeleteOrWriteFile} commands.
 * @param projectId The project ID to use for identifying and generating task IDs.
 * @param directory The directory to transform.
 */
export async function transformMarkdownDirectoryToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  directory: string,
): Promise<DeleteOrWriteFile[]> {
  const inputAsts: Record<string, Nodes> = await pipeAsync3(
    getMarkdownFilePathsInDirectory,
    readTextFilesToInputs,
    inputsToInputAsts,
  )(
    directory,
  );
  return await transformAstsToOutputCommands(projectId, inputAsts);
}
