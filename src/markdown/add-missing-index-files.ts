import { basename, dirname } from "@std/path";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import {
  DeleteOrWriteFile,
  isWriteFile,
  WriteFile,
} from "../model/output-command.ts";
import { sortUnique } from "@hugojosefson/fns/string/sort-unique";

/**
 * Adds missing index files to the output commands.
 *
 * - Figures out which directories will be present after executing the output commands. The output commands do not specify directories, so this is done by looking at the paths of the output commands which mention files.
 * - Ignore the base path directory, and any directories that are not subdirectories of the base path.
 * - For each directory, if there is no index file, then creates an index file.
 * - If there is an index file, leave it as is.
 * - The new index file contains `# ${directoryName}\n\n<!-- index -->\n`.
 * @param basePath The base path of the project.
 * @param outputCommands The output commands that may or may not have index files.
 * @returns The output commands with any missing index files added.
 */
export function addMissingIndexFiles(
  basePath: string,
  outputCommands: DeleteOrWriteFile[],
): DeleteOrWriteFile[] {
  const commandPaths: string[] = outputCommands
    .filter(isWriteFile)
    .map((outputCommand) => outputCommand.path);
  const directoriesMentioned = directoriesMentionedInPaths(commandPaths);
  const directories: string[] = directoriesMentioned
    .filter((directory) =>
      directory === basePath || directory.startsWith(basePath + "/")
    );

  const existingIndexFiles = outputCommands
    .filter(isWriteFile)
    .filter((outputCommand) => /(\/|^)index\.md$/.test(outputCommand.path))
    .map((outputCommand) => outputCommand.path);

  const missingIndexFiles = directories
    .filter((directory) =>
      !existingIndexFiles.includes(directory + "/index.md")
    )
    .map((directory) => directory + "/index.md");

  const missingIndexFileCommands = missingIndexFiles.map((path) => {
    const content = indexContent(path);
    return ({
      action: "write",
      path,
      content,
      ast: markdownToAst(content),
    } as WriteFile);
  });

  return [
    ...outputCommands,
    ...missingIndexFileCommands,
  ];
}

/**
 * Generates the content for an index file.
 * @param path The path of the index file.
 */
function indexContent(
  path: string,
): `# ${string}

<!-- index -->

<!-- /index -->
` {
  return `# ${basename(dirname(path))}

<!-- index -->

<!-- /index -->
`;
}

/**
 * Finds all directories mentioned in the given paths.
 * @param paths The paths to find directories in.
 */
export function directoriesMentionedInPaths(paths: string[]): string[] {
  return sortUnique(paths.flatMap(directoriesMentionedInPath));
}

/**
 * Uses recursion to find all directories mentioned in the given path.
 * @example
 * directoriesMentionedInPath("/a/b/c/d/e.md") // ["/a", "/a/b", "/a/b/c", "/a/b/c/d"]
 * @param path The path to find directories in.
 */
export function directoriesMentionedInPath(
  path: string,
): string[] {
  if (path === "") {
    return [];
  }
  if (path === "/") {
    return [];
  }
  const parent = dirname(path);
  return [
    ...directoriesMentionedInPath(parent),
    parent,
  ];
}
