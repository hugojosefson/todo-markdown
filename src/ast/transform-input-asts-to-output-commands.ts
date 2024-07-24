import pFilter from "npm:p-filter";
import { notAsync } from "@hugojosefson/fns/fn/not";
import { orAsync } from "@hugojosefson/fns/fn/or";
import { addMissingIndexFiles } from "../markdown/add-missing-index-files.ts";
import { deconflictOutputCommands } from "../markdown/deconflict-output-commands.ts";
import { updateLinksInOutputCommands } from "../markdown/update-links-in-output-commands.ts";
import { InputAsts } from "../model/input-asts.ts";
import {
  DeleteOrWriteFile,
  isDeleteFile,
  isWriteFile,
  OutputCommand,
} from "../model/output-command.ts";
import { ProjectId } from "../model/project-id.ts";
import { createNextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { updateIndexInOutputCommands } from "./index/update-index-in-output-commands.ts";
import { transformInputAstToOutputCommands } from "./transform-input-ast-to-output-commands.ts";

/**
 * Filters out {@link DeleteOrWriteFile} commands that do not change the file,
 * compared to any current file on disk.
 * {@link WriteFile} commands are filtered out if the file already exists and
 * the contents are the same. Instead of checking if the file exists, attempts
 * to read the file are made, and if the error is {@link Deno.errors.NotFound},
 * the file is assumed to not exist.
 *
 * {@link DeleteFile} commands are filtered out if the file does not exist.
 *
 * Uses {@link isWriteFile} and {@link isDeleteFile} to determine the type of
 * command.
 *
 * @param outputCommands The output commands to filter.
 * @returns The filtered output commands.
 */
export async function withOnlyChangedFiles(
  outputCommands: DeleteOrWriteFile[],
): Promise<DeleteOrWriteFile[]> {
  const isUnnecessary = orAsync(
    isWriteFileWithSameContents,
    isDeleteFileAlreadyDeleted,
  );
  const isNecessary = notAsync(isUnnecessary);
  return await pFilter(outputCommands, isNecessary);
}

export async function isWriteFileWithSameContents(
  outputCommand: DeleteOrWriteFile,
): Promise<boolean> {
  if (!isWriteFile(outputCommand)) {
    return false;
  }

  try {
    return outputCommand.content ===
      await Deno.readTextFile(outputCommand.path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export async function isDeleteFileAlreadyDeleted(
  outputCommand: DeleteOrWriteFile,
): Promise<boolean> {
  if (!isDeleteFile(outputCommand)) {
    return false;
  }

  try {
    await Deno.stat(outputCommand.path);
    return false;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return true;
    }
    throw error;
  }
}

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
        basePath,
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
  const outputCommandsWithAddedMissingIndexFiles = addMissingIndexFiles(
    basePath,
    deconflictedOutputCommands,
  );
  const outputCommandsWithShallowIndex = await updateIndexInOutputCommands(
    outputCommandsWithAddedMissingIndexFiles,
  );

  return await withOnlyChangedFiles(outputCommandsWithShallowIndex);
}
