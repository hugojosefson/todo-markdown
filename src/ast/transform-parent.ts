import { Parent } from "npm:@types/mdast";

import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { transformNode } from "./transform-node.ts";

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
