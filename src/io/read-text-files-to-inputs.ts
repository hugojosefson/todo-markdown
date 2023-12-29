import { Inputs } from "../model/inputs.ts";

/**
 * Reads the given Markdown text files, and returns a record of their paths and contents.
 * @param inputPaths the paths of the text files to read
 */
export async function readTextFilesToInputs(
  inputPaths: string[],
): Promise<Inputs> {
  return Object.fromEntries(
    await Promise.all(
      inputPaths.map(async (inputPath) => [
        inputPath,
        await Deno.readTextFile(inputPath),
      ]),
    ),
  );
}
