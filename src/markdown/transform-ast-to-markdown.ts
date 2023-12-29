import { Link, Nodes } from "npm:@types/mdast";
import { basename } from "std/path/basename.ts";
import { extname } from "std/path/extname.ts";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "../ast/extract-first-top-level-heading.ts";
import { markdownToAst } from "../ast/markdown-to-ast.ts";
import { transformNode } from "../ast/transform-node.ts";
import { isLink, isParent, isText } from "../ast/types.ts";
import {
  DeleteOrWriteFile,
  isDeleteFile,
  isUpdateLinksToFile,
  isWriteFile,
  OutputCommand,
} from "../commands/output-command.ts";
import { pipeAsync3, swallow } from "../fn.ts";
import { getInputPaths } from "../io/get-input-paths.ts";
import { getInputs } from "../io/get-inputs.ts";
import { sequence } from "../regex.ts";
import { hasProtocol } from "../strings/has-protocol.ts";
import { isFragment } from "../strings/is-fragment.ts";
import { ProjectId } from "../strings/project-id.ts";
import { createNextIdentifierNumberGetter } from "../strings/task-id-number.ts";
import { getInputAsts } from "./get-input-asts.ts";

/**
 * Transforms a single AST, and outputs the result as markdown.
 * @param projectId The project ID to use for identifying and generating task IDs.
 * @param ast The AST to transform.
 * @param otherAstsToConsiderForIdentifierNumbers Other ASTs to consider when generating task IDs. This is useful when you want to generate task IDs that are unique across multiple files.
 */
export async function transformAstToMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  ast: Nodes,
  otherAstsToConsiderForIdentifierNumbers: Nodes[] = [],
): Promise<string> {
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    [ast, ...otherAstsToConsiderForIdentifierNumbers],
  );
  return await astToMarkdown(
    transformNode(
      projectId,
      nextIdentifierNumberGetter,
      ast,
    ),
  );
}

export async function transformNodeToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: () => number,
  inputPath: string,
  inputAst: Nodes,
): Promise<OutputCommand[]> {
  const outputAst = transformNode(
    projectId,
    nextIdentifierNumberGetter,
    inputAst,
  );
  const headingString = extractFirstTopLevelHeadingString(
    outputAst,
  );
  const outputPath = headingString
    ? inputPath.replace(
      /\/([^\/]+)\.md$/,
      `/${headingString}.md`,
    )
    : inputPath;

  const output = await astToMarkdown(outputAst);
  if (inputPath === outputPath) {
    // writing to the same file
    return [
      {
        action: "write",
        path: outputPath,
        content: output,
      },
    ];
  } else {
    // writing to a different file, deleting the old file
    return [
      {
        action: "delete",
        path: inputPath,
      },
      {
        action: "write",
        path: outputPath,
        content: output,
      },
      {
        action: "update-links",
        fromPath: inputPath,
        toPath: outputPath,
      },
    ];
  }
}

export async function transformMarkdownAsts<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  inputAsts: Record<string, Nodes>,
): Promise<DeleteOrWriteFile[]> {
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    Object.values(inputAsts),
  );

  const outputCommandsPromises: Promise<OutputCommand[]>[] = Object
    .entries(
      inputAsts,
    )
    .map(async ([inputPath, inputAst]) =>
      await transformNodeToOutputCommands(
        projectId,
        nextIdentifierNumberGetter,
        inputPath,
        inputAst,
      )
    );
  const outputCommands: OutputCommand[] =
    (await Promise.all(outputCommandsPromises)).flat();
  const outputCommandsWithUpdatedLinks: DeleteOrWriteFile[] = await updateLinks(
    outputCommands,
  );
  return deconflictOutputCommands(outputCommandsWithUpdatedLinks);
}

export async function transformMarkdownDirectory<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  directory: string,
): Promise<DeleteOrWriteFile[]> {
  const inputAsts: Record<string, Nodes> = await pipeAsync3(
    getInputPaths,
    getInputs,
    getInputAsts,
  )(
    directory,
  );
  return await transformMarkdownAsts(projectId, inputAsts);
}

/**
 * Finds {@link UpdateLinksToFile} commands in the input commands, obeying them by updating Markdown links within the
 * {@link WriteFile#content} field of all {@link WriteFile} commands (since all {@link WriteFile} commands may have
 * markdown content with links referring to the renamed path. The {@link WriteFile#content} field is a string of
 * markdown content, and this function updates all links in that string, so that they point to the correct path.
 * @param outputCommands The output commands which have content that needs to be updated.
 * @returns The output command that remain, after processing and filtering out all the {@link UpdateLinksToFile} commands.
 */
export async function updateLinks(
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

/**
 * Updates all links in the given markdown content, so that they point to the correct path.
 * Uses {@link markdownToAst} to parse the markdown content into an AST, and then uses {@link updateLinksInMarkdownAst}
 * to update the links in the AST, and then uses {@link astToMarkdown} to convert the AST back into markdown content.
 * @param path The path of the markdown file that the content is from.
 * @param content The markdown content to update the links in.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 */
export async function updateLinksInMarkdownContent(
  path: string,
  content: string,
  pathUpdatesMap: Map<string, string>,
): Promise<string> {
  const ast = markdownToAst(content);
  const updatedAst = updateLinksInMarkdownAst(path, ast, pathUpdatesMap);
  return await astToMarkdown(updatedAst);
}

/**
 * Updates all links in the given markdown AST, so that they point to the correct path.
 * This function does not use {@link transformNode}, because it does not need to transform the AST in that way. Instead, it traverses the AST, and updates all links in the AST.
 * @param path The path of the markdown file that the AST is from.
 * @param ast The markdown AST to update the links in.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 */
export function updateLinksInMarkdownAst<T extends Nodes>(
  path: string,
  ast: T,
  pathUpdatesMap: Map<string, string>,
): T {
  if (isLink(ast)) {
    return updateMarkdownLinkNode(path, ast, pathUpdatesMap) as T;
  }
  if (isParent(ast)) {
    const children = ast.children.map((child) =>
      updateLinksInMarkdownAst(path, child, pathUpdatesMap)
    );
    return {
      ...ast,
      children,
    };
  }
  return ast;
}

/**
 * Updates the given Markdown link node, so that it points to the correct path.
 * @param path The path of the markdown file that the link is from.
 * @param linkNode The link node to update.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 * @returns The updated link node.
 */
export function updateMarkdownLinkNode<T extends Link>(
  path: string,
  linkNode: T,
  pathUpdatesMap: Map<string, string>,
): T {
  const url = decodeURI((linkNode.url as string).replace(/#.*$/, ""));
  const fragment = (linkNode.url as string).replace(/^[^#]*/, "");
  const updatedUrl = updateLink(path, url, pathUpdatesMap);
  if (updatedUrl === url) {
    return linkNode;
  }
  const uriEncodedUpdatedUrl = encodeURI(updatedUrl) + fragment;

  // If the link node only has one child, and that child is a text node.
  if (linkNode.children.length === 1) {
    const child = linkNode.children[0];
    if (isText(child)) {
      // text contains the filename of the url, without the extension
      const extLessUrlBasename = basename(url, extname(url));
      const extLessUpdatedUrlBasename = basename(
        updatedUrl,
        extname(updatedUrl),
      );
      const extLessUrlBasenameRegex = sequence(extLessUrlBasename);
      if (extLessUrlBasenameRegex.test(child.value)) {
        const updatedText = child.value.replace(
          extLessUrlBasenameRegex,
          extLessUpdatedUrlBasename,
        );
        return {
          ...linkNode,
          url: uriEncodedUpdatedUrl,
          children: [
            {
              ...child,
              value: updatedText,
            },
          ],
        };
      }
    }
  }

  // Otherwise, we can just update the link node's url.
  return {
    ...linkNode,
    url: uriEncodedUpdatedUrl,
  };
}

/**
 * Updates the given link, so that it points to the correct path.
 * @param basePathOfLink The path of the markdown file that the link is from.
 * @param link The link to update.
 * @param linkUpdates A map from paths to update, to their new path.
 */
export function updateLink(
  basePathOfLink: string,
  link: string,
  linkUpdates: Map<string, string>,
): string {
  // 1. Cases when we don't need to update the link, and can return it as-is:
  //   - The link has a protocol
  //   - The link is only a fragment
  // 2. We then need to calculate the absolute path of the link, relative to the input markdown file
  // 3. We then need to check if the absolute path of the link is in the map of paths to update
  // 4. If it is, then we need to update the link
  // 5. If it is not, then we can return the link as-is

  if (hasProtocol(link)) {
    return link;
  }

  if (isFragment(link)) {
    return link;
  }

  const resolvedAbsoluteTarget = resolveAbsoluteTarget(basePathOfLink, link);
  const targetWasRenamed = linkUpdates.has(resolvedAbsoluteTarget);

  if (targetWasRenamed) {
    const newAbsoluteTarget = linkUpdates.get(resolvedAbsoluteTarget)!;
    return getRelative(basePathOfLink, newAbsoluteTarget);
  }

  return link;
}

/**
 * Returns the absolute path of the link, relative to the input markdown file.
 * @param basePath The path of the markdown file that the link is from.
 * @param link The link to get the absolute path of.
 * @returns The absolute path of the link, relative to the input markdown file.
 */
export function resolveAbsoluteTarget(basePath: string, link: string): string {
  const basePathDirectory = basePath.replace(/\/[^\/]+$/, "");
  return `${basePathDirectory}/${link}`;
}

/**
 * Returns the link, relative to the input markdown file.
 * @param basePath The path of the markdown file that the link is from.
 * @param absoluteTarget The absolute path of the link, relative to the input markdown file.
 * @returns The link, relative to the input markdown file.
 */
export function getRelative(basePath: string, absoluteTarget: string): string {
  const basePathDirectory = basePath.replace(/\/[^\/]+$/, "");
  return absoluteTarget
    .replace(basePathDirectory, "")
    .replace(/^\//, "");
}

/**
 * Sorts strings, and removes any duplicates.
 * @param strings The strings to sort and remove duplicates from.
 * @returns The sorted strings, with duplicates removed.
 */
export function sortUnique(strings: string[]): string[] {
  return [...(new Set(strings)).values()].sort();
}

/**
 * Takes care of collisions between output paths.
 *
 * - If two commands want to write to the same output path, and the content they want to write is the same, then it's fine. Just keep one of them.
 * - If two commands want to write to the same output path, and the content they want to write is different, then it's a collision. Concatenate the outputs, and make it only one Write.
 * - If there is one Delete and one Write to the same path, then it's a collision. Discard the Delete one, and keep the Write one.
 * @param possiblyConflictingOutputCommands The output commands to deconflict.
 * @returns The deconflicted output commands.
 */
export function deconflictOutputCommands(
  possiblyConflictingOutputCommands: DeleteOrWriteFile[],
): DeleteOrWriteFile[] {
  const outputCommands: DeleteOrWriteFile[] = [];
  const commandsByPath: Record<
    DeleteOrWriteFile["action"],
    DeleteOrWriteFile[]
  > = Object.groupBy(
    possiblyConflictingOutputCommands,
    (command) => command.path,
  );

  for (const [path, commands] of Object.entries(commandsByPath)) {
    // If there is only one command, then there is no conflict.
    if (commands.length === 1) {
      outputCommands.push(commands[0]);
      continue;
    }

    // If there are multiple commands, and they are all deletes, then there is no conflict.
    const writeCommands = commands.filter(isWriteFile);
    if (writeCommands.length === 0) {
      outputCommands.push(commands[0]);
      continue;
    }

    // We are writing to the file
    const contents = writeCommands.map((command) => command.content);
    const content = sortUnique(contents).join("\n");
    outputCommands.push({
      action: "write",
      path,
      content,
    });
  }

  return outputCommands;
}

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
