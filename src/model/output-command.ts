import { and } from "../fn.ts";
import { isString } from "../strings/is-string.ts";
import { createIsRecordWithProperty } from "./record.ts";
import { TypeGuard } from "./type-guard.ts";

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
export const isDeleteFile: TypeGuard<DeleteFile> = and(
  createIsRecordWithProperty(
    "action",
    "delete",
  ),
  createIsRecordWithProperty(
    "path",
    isString,
  ),
) as TypeGuard<DeleteFile>;

/**
 * Type-guard for WriteFile.
 * @param output The output command to check.
 */
export const isWriteFile: TypeGuard<WriteFile> = and(
  createIsRecordWithProperty(
    "action",
    "write",
  ),
  createIsRecordWithProperty(
    "path",
    isString,
  ),
  createIsRecordWithProperty(
    "content",
    isString,
  ),
) as TypeGuard<WriteFile>;

/**
 * Type-guard for UpdateLinksToFile.
 * @param output The output command to check.
 */
export const isUpdateLinksToFile: TypeGuard<UpdateLinksToFile> = and(
  createIsRecordWithProperty(
    "action",
    "update-links",
  ),
  createIsRecordWithProperty(
    "fromPath",
    isString,
  ),
  createIsRecordWithProperty(
    "toPath",
    isString,
  ),
) as TypeGuard<UpdateLinksToFile>;
