import { Parent } from "npm:@types/mdast";

import { ProjectId } from "../strings/project-id.ts";
import { NextIdentifierNumberGetter } from "../strings/task-id-number.ts";
import { replaceNode } from "./replace-node.ts";

export function replaceParent<
  T extends Parent,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumberGetter,
  parent: T,
): T {
  return {
    ...parent,
    children: parent.children.map((child) =>
      replaceNode(projectId, nextIdentifierNumber, child)
    ),
  };
}
