import { Parent } from "npm:@types/mdast";

import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { transformNode } from "./transform-node.ts";

export function replaceParent<
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
