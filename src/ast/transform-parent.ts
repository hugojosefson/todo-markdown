import { List, Parent } from "npm:@types/mdast";

import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { transformNode } from "./transform-node.ts";
import {
  isHtmlTocBegin,
  isHtmlTocEnd,
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
  const children: Children = parent.children;
  if (children.length === 0) {
    return parent;
  }

  // if any child isHtmlCommentTableOfContentsStart(), then replace
  // everything between (exclusive!) that and the next node that isHtmlCommentTableOfContentsEnd(),
  // with a TableOfContents node.
  // If a node that isHtmlCommentTableOfContentsEnd() is not found, then insert one immediately after
  // the TableOfContents node.
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
            newChildren: [...newChildren, createTableOfContents()],
            inToc: true,
          };
        }
        return {
          newChildren: [
            ...newChildren,
            transformNode(projectId, nextIdentifierNumberGetter, child),
          ],
          inToc: false,
        };
      },
      { newChildren: [], inToc: false },
    ).newChildren,
  };
}

function createTableOfContents(): List {
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
            children: [
              {
                type: "link",
                url: `link-to-that-page`,
                children: [
                  {
                    type: "text",
                    value: "Placeholder for Table of Contents items",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
