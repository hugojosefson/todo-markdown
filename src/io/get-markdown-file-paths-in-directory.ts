import { walk, WalkEntry } from "std/fs/walk.ts";

/**
 * Returns the paths of all {@code .md} files in the given directory.
 * @param directory the directory to search
 */
export async function getMarkdownFilePathsInDirectory(
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
