import { DeleteOrWriteFile, isDeleteFile } from "../commands/output-command.ts";
import { swallow } from "../fn.ts";

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
