import { Checked } from "../../model/box.ts";

export type IndexEntryDirectory = {
  type: "directory";
  name: string;
  path: string;
};
export type IndexEntryFile = {
  type: "file";
  name: string;
  path: string;
  isThisFile: boolean;
};
export type IndexEntryTask = {
  type: "task";
  name: string;
  path: string;
  checked: Checked | "…";
  isThisFile: boolean;
};
export type IndexEntry =
  | IndexEntryDirectory
  | IndexEntryFile
  | IndexEntryTask;

export function isIndexEntryTask(
  indexEntry: IndexEntry,
): indexEntry is IndexEntryTask {
  return indexEntry.type === "task";
}

export function isIndexEntryDirectory(
  indexEntry: IndexEntry,
): indexEntry is IndexEntryDirectory {
  return indexEntry.type === "directory";
}

export function isIndexEntryFile(
  indexEntry: IndexEntry,
): indexEntry is IndexEntryFile {
  return indexEntry.type === "file";
}
