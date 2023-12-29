export async function getInputs(
  inputPaths: string[],
): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      inputPaths.map(async (inputPath) => [
        inputPath,
        await Deno.readTextFile(inputPath),
      ]),
    ),
  );
}
