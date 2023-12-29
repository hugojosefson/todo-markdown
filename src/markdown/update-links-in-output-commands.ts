import {
  DeleteOrWriteFile,
  isDeleteFile,
  isUpdateLinksToFile,
  isWriteFile,
  OutputCommand,
} from "../model/output-command.ts";

import { updateLinksInMarkdownContent } from "./update-links-in-markdown-content.ts";

/**
 * Finds {@link UpdateLinksToFile} commands in the input commands, obeying them by updating Markdown links within the
 * {@link WriteFile#content} field of all {@link WriteFile} commands (since all {@link WriteFile} commands may have
 * markdown content with links referring to the renamed path. The {@link WriteFile#content} field is a string of
 * markdown content, and this function updates all links in that string, so that they point to the correct path.
 * @param outputCommands The output commands which have content that needs to be updated.
 * @returns The output command that remain, after processing and filtering out all the {@link UpdateLinksToFile} commands.
 */
export async function updateLinksInOutputCommands(
  outputCommands: OutputCommand[],
): Promise<DeleteOrWriteFile[]> {
  const updateLinksToFileCommands = outputCommands.filter(isUpdateLinksToFile);
  const writeCommands = outputCommands.filter(isWriteFile);

  const pathUpdatesMap: Map<string, string> = new Map(
    updateLinksToFileCommands.map((command) =>
      [command.fromPath, command.toPath] as const
    ),
  );

  const updatedWriteCommands = await Promise.all(
    writeCommands.map(async (command) => ({
      ...command,
      content: await updateLinksInMarkdownContent(
        command.path,
        command.content,
        pathUpdatesMap,
      ),
    })),
  );

  return [...updatedWriteCommands, ...outputCommands.filter(isDeleteFile)];
}
