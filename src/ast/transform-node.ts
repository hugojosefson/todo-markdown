import { Node } from "npm:@types/mdast";
import { ProjectId } from "../strings/project-id.ts";
import { NextIdentifierNumberGetter } from "../strings/task-id-number.ts";
import { replaceHeading } from "./replace-heading.ts";
import { replaceListItem } from "./replace-list-item.ts";
import { replaceParent } from "./replace-parent.ts";
import { isHeading, isListItem, isParent } from "./types.ts";

export function transformNode<N extends Node, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
  node: N,
): N {
  if (isHeading(node)) {
    return replaceParent(
      projectId,
      nextIdentifierNumberGetter,
      replaceHeading(projectId, nextIdentifierNumberGetter, node),
    ) as unknown as N;
  }

  if (isListItem(node)) {
    return replaceParent(
      projectId,
      nextIdentifierNumberGetter,
      replaceListItem(projectId, nextIdentifierNumberGetter, node),
    ) as unknown as N;
  }

  if (isParent(node)) {
    return replaceParent(projectId, nextIdentifierNumberGetter, node);
  }
  return node;
}
