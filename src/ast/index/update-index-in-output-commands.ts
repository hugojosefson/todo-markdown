import { Nodes } from "npm:@types/mdast";
import { dirname } from "@std/path/dirname";
import { relative } from "@std/path/relative";
import {
  DeleteFile,
  DeleteOrWriteFile,
  isDeleteFile,
  isWriteFile,
  WriteFile,
} from "../../model/output-command.ts";
import { astToMarkdown } from "../ast-to-markdown.ts";
import {
  HtmlCommentEndString,
  HtmlCommentString,
  HtmlWithValue,
  INDEX,
  Index,
  isHtmlIndexBegin,
  isHtmlIndexEnd,
  isParent,
} from "../node-types.ts";
import { Child, Children, ChildrenAccumulator } from "./child.ts";
import { createIndex } from "./create-index.ts";

export async function updateIndexInOutputCommands(
  commands: DeleteOrWriteFile[],
): Promise<DeleteOrWriteFile[]> {
  const writeCommands: WriteFile[] = commands.filter(isWriteFile);
  const deleteCommands: DeleteFile[] = commands.filter(isDeleteFile);
  return [
    ...deleteCommands,
    ...await Promise.all(writeCommands.map(async (writeCommand) => {
      const ast = addAnyIndex(
        writeCommand.path,
        writeCommand.ast,
        writeCommands,
      );
      return {
        ...writeCommand,
        content: await astToMarkdown(ast),
        ast,
      };
    })),
  ];
}

/**
 * Looks through the given output commands, and checks each {@link WriteFile#ast} field for any child node that
 * {@link isHtmlIndexBegin}, then replace everything between (exclusive!) that and the next node that
 * {@link isHtmlIndexEnd}, with an Index node.
 * If a node that isHtmlIndexEnd() is not found, then insert one immediately after
 * the Index node.
 */
export function addAnyIndex<
  T extends Nodes,
>(
  filePath: string,
  node: T,
  commands: WriteFile[],
): T {
  if (!isParent(node)) {
    return node;
  }
  const parent = node;
  const children: Children = parent.children;
  if (children.length === 0) {
    return parent;
  }

  const hasIndexEnd = children.some(isHtmlIndexEnd);
  // ready to write an index!
  return {
    ...parent,
    children: children.reduce(
      (
        { newChildren, isInsideComment }: ChildrenAccumulator,
        child: Child,
      ): ChildrenAccumulator => {
        if (isInsideComment) {
          // exclude the current child
          if (isHtmlIndexEnd(child)) {
            return {
              newChildren,
              isInsideComment: false,
            };
          }
          return { newChildren, isInsideComment };
        }
        if (isHtmlIndexBegin(child)) {
          const indexBegin: HtmlWithValue<HtmlCommentString<Index>> = child;
          const indexEnd: HtmlWithValue<HtmlCommentEndString<Index>> = {
            type: "html",
            value: `<!-- /${INDEX} -->`,
          };
          /** only include files that are in the same directory, or the index.md files in immediate subdirectories */
          const inSameDirectoryOrIndexMdInImmediateSubdirs = (
            writeFile: WriteFile,
          ) => {
            const relativePath = relative(
              dirname(filePath),
              writeFile.path,
            );
            const relativePathParts = relativePath.split("/");
            if (relativePathParts[0] === "..") {
              return false;
            }
            if (relativePathParts.length === 1) {
              return true;
            }
            if (relativePathParts.length !== 2) {
              return false;
            }
            if (relativePathParts[0] === "..") {
              return false;
            }
            return relativePathParts[1] === "index.md";
          };
          return {
            newChildren: [
              ...newChildren,
              indexBegin,
              ...createIndex(
                dirname(filePath),
                filePath,
                commands
                  .filter(isWriteFile)
                  // exclude the current file
                  .filter(
                    (writeFile) => writeFile.path !== filePath,
                  )
                  // only include files that are in the same directory, or the index.md files in immediate subdirectories
                  .filter(inSameDirectoryOrIndexMdInImmediateSubdirs),
              ),
              indexEnd,
            ],
            isInsideComment: hasIndexEnd,
          };
        }
        return {
          newChildren: [
            ...newChildren,
            addAnyIndex(filePath, child, commands),
          ],
          isInsideComment: false,
        };
      },
      { newChildren: [], isInsideComment: false },
    ).newChildren,
  };
}
