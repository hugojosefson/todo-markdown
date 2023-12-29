import { walk, WalkEntry } from "std/fs/walk.ts";

export async function getInputPaths(
  directory: string,
): Promise<string[]> {
  const inputPaths: string[] = [];
  for await (
    const inputWalkEntry of walk(directory, {
      includeDirs: false,
      match: [/\.md$/],
    })
  ) {
    inputPaths.push((inputWalkEntry as WalkEntry).path);
  }
  return inputPaths;
}
