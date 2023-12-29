import { Node } from "npm:@types/mdast";
import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { transformHeading } from "./transform-heading.ts";
import { transformListItem } from "./transform-list-item.ts";
import { transformParent } from "./transform-parent.ts";
import { isHeading, isListItem, isParent } from "./node-types.ts";

/**
 * Transforms the given {@link Node}.
 * @param projectId The project identifier to use.
 * @param nextIdentifierNumberGetter The function to use to get the next identifier number.
 * @param node The node to transform.
 * @returns The transformed node.
 */
export function transformNode<N extends Node, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
  node: N,
): N {
  if (isHeading(node)) {
    return transformParent(
      projectId,
      nextIdentifierNumberGetter,
      transformHeading(projectId, nextIdentifierNumberGetter, node),
    ) as unknown as N;
  }

  if (isListItem(node)) {
    return transformParent(
      projectId,
      nextIdentifierNumberGetter,
      transformListItem(projectId, nextIdentifierNumberGetter, node),
    ) as unknown as N;
  }

  if (isParent(node)) {
    return transformParent(projectId, nextIdentifierNumberGetter, node);
  }
  return node;
}
