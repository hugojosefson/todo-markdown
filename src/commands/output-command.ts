export type DeleteFile = { action: "delete"; path: string };
export type WriteFile = { action: "write"; path: string; content: string };
export type UpdateLinksToFile = {
  action: "update-links";
  fromPath: string;
  toPath: string;
};

export type DeleteOrWriteFile =
  | DeleteFile
  | WriteFile;

export type OutputCommand =
  | DeleteOrWriteFile
  | UpdateLinksToFile;

export function isDeleteFile(
  output: OutputCommand,
): output is DeleteFile {
  return output.action === "delete";
}

export function isWriteFile(
  output: OutputCommand,
): output is WriteFile {
  return output.action === "write";
}

export function isUpdateLinksToFile(
  output: OutputCommand,
): output is UpdateLinksToFile {
  return output.action === "update-links";
}
