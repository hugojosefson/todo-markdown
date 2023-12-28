import { relative } from "std/path/relative.ts";
import { List, Nodes, Parent } from "npm:@types/mdast";
import { DeleteOrWriteFile, isWriteFile } from "../model/output-command.ts";
import { sequence } from "../strings/regex.ts";

import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { startsWithA } from "../strings/text-type-guard.ts";
import { transformNode } from "./transform-node.ts";
import {
  HtmlCommentEndString,
  HtmlWithValue,
  isHtmlTocBegin,
  isHtmlTocEnd,
  isParent,
  TOC,
  Toc,
} from "./node-types.ts";

type Children = Parent["children"];
type Child = Children[number];
type Accumulator = {
  newChildren: Children;
  inToc: boolean;
};

/**
 * Transforms the given {@link Parent}.
 * @param projectId The project identifier to use.
 * @param nextIdentifierNumberGetter The function to use to get the next identifier number.
 * @param parent The parent node to transform.
 * @returns The transformed parent node.
 */
export function transformParent<
  T extends Parent,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
  parent: T,
): T {
  return {
    ...parent,
    children: parent.children.map((child) =>
      transformNode(projectId, nextIdentifierNumberGetter, child)
    ),
  };
}

/**
 * Looks through the given output commands, and checks each {@link WriteFile#ast} field for any child node that {@link isHtmlCommentTableOfContentsStart}.
 * then replace
 * everything between (exclusive!) that and the next node that isHtmlCommentTableOfContentsEnd(),
 * with a TableOfContents node.
 * If a node that isHtmlCommentTableOfContentsEnd() is not found, then insert one immediately after
 * the TableOfContents node.
 */
export function addAnyToc<
  T extends Nodes,
>(
  node: T,
  basePath: string,
  tocFilePath: string,
  outputCommands: DeleteOrWriteFile[],
): T {
  if (!isParent(node)) {
    return node;
  }
  const parent = node;
  const children: Children = parent.children;
  if (children.length === 0) {
    return parent;
  }

  const hasTocEnd = children.some(isHtmlTocEnd);
  // ready to write a toc!
  return {
    ...parent,
    children: children.reduce(
      ({ newChildren, inToc }: Accumulator, child: Child): Accumulator => {
        if (inToc) {
          if (isHtmlTocEnd(child)) {
            return {
              newChildren,
              inToc: false,
            };
          }
          return { newChildren, inToc };
        }
        if (isHtmlTocBegin(child)) {
          return {
            newChildren: [
              ...newChildren,
              child,
              createTableOfContents(basePath, tocFilePath, outputCommands),
              {
                type: "html",
                value: `<!-- /${TOC} -->`,
              } satisfies HtmlWithValue<HtmlCommentEndString<Toc>>,
            ],
            inToc: hasTocEnd,
          };
        }
        return {
          newChildren: [
            ...newChildren,
            child,
          ],
          inToc: false,
        };
      },
      { newChildren: [], inToc: false },
    ).newChildren,
  };
}

export function createTableOfContents(
  basePath: string,
  tocFilePath: string,
  outputCommands: DeleteOrWriteFile[],
): List {
  const startsWithBasePath = startsWithA(sequence(basePath));
  return {
    type: "list",
    ordered: false,
    children: [
      {
        type: "listItem",
        checked: null,
        children: [
          {
            type: "paragraph",
            children: outputCommands.filter(isWriteFile).map((writeFile) => {
              const pathRelativeToBasePath = writeFile.path.replace(
                startsWithBasePath.regex,
                "",
              );
              const pathRelativeToBasePathWithoutExtension =
                pathRelativeToBasePath.replace(/\.md$/, "");
              const writeFilePathRelativeToTocFilePath = relative(
                tocFilePath,
                writeFile.path,
              );

              return {
                type: "link",
                url: writeFilePathRelativeToTocFilePath,
                children: [
                  {
                    type: "text",
                    value: pathRelativeToBasePathWithoutExtension,
                  },
                ],
              };
            }),
          },
        ],
      },
    ],
  };
}
