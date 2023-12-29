import { DeleteOrWriteFile, isDeleteFile } from "../model/output-command.ts";
import { swallow } from "../fn.ts";

/**
 * Writes the given outputs to the file system.
 * @param outputs The outputs to write.
 */
export async function writeChanges(
  outputs: DeleteOrWriteFile[],
): Promise<void> {
  for (const command of outputs) {
    if (isDeleteFile(command)) {
      await Deno.remove(command.path).catch(swallow(Deno.errors.NotFound));
    } else {
      await Deno.writeTextFile(command.path, command.content);
    }
  }
}
