/**
 * A command to delete a file.
 */
export type DeleteFile = { action: "delete"; path: string };

/**
 * A command to write a file, with specific content.
 */
export type WriteFile = { action: "write"; path: string; content: string };

/**
 * A command to update any links what point to a path, to point to its new path.
 */
export type UpdateLinksToFile = {
  action: "update-links";
  fromPath: string;
  toPath: string;
};

/**
 * Commands for writing to the filesystem.
 */
export type DeleteOrWriteFile =
  | DeleteFile
  | WriteFile;

/**
 * The commands that we generate as output.
 * We can unit-test functions that return these, without writing to the filesystem.
 */
export type OutputCommand =
  | DeleteOrWriteFile
  | UpdateLinksToFile;

/**
 * Type-guard for DeleteFile.
 * @param output The output command to check.
 */
export function isDeleteFile(
  output: OutputCommand,
): output is DeleteFile {
  return output.action === "delete";
}

/**
 * Type-guard for WriteFile.
 * @param output The output command to check.
 */
export function isWriteFile(
  output: OutputCommand,
): output is WriteFile {
  return output.action === "write";
}

/**
 * Type-guard for UpdateLinksToFile.
 * @param output The output command to check.
 */
export function isUpdateLinksToFile(
  output: OutputCommand,
): output is UpdateLinksToFile {
  return output.action === "update-links";
}
