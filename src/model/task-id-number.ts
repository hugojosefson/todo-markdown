import { reduceToLargestNumber } from "../numbers.ts";
import { extractA } from "../strings/extract-a.ts";
import {
  containsA,
  isOnlyA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import { ProjectId } from "./project-id.ts";
import { createExtractTaskId } from "./task-id.ts";

import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { isString } from "run_simple/src/fn.ts";

export const TASK_ID_NUMBER_REGEX = /(?<taskIdNumber>\d+)/u;
export type TaskIdNumber = `{number}`;
export const isTaskIdNumber: TextTypeGuard<TaskIdNumber> = isOnlyA<
  TaskIdNumber
>(
  TASK_ID_NUMBER_REGEX,
);
export const containsTaskIdNumber = containsA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);
export const extractTaskIdNumber = extractA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);

/**
 * Finds the maximum identifier number in the given trees.
 * @param projectId The project identifier to search for.
 * @param trees The trees to search in.
 * @returns The maximum identifier number in the given tree.
 */
export function getMaxIdentifierNumber<PI extends ProjectId = ProjectId>(
  projectId: PI,
  trees: Nodes[],
): number {
  const texts: Text[] = trees.flatMap((tree) =>
    selectAll("text", tree) as Text[]
  );
  return texts
    .map(createExtractTaskId(projectId))
    .filter(isString)
    .map((x) => x!)
    .map(extractTaskIdNumber)
    .filter(isString)
    .map((x) => x!)
    .map((taskIdNumber) => parseInt(taskIdNumber, 10))
    .reduce(reduceToLargestNumber, 0);
}

export type NextIdentifierNumberGetter = () => number;

export function createNextIdentifierNumberGetter<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  trees: Nodes[],
): NextIdentifierNumberGetter {
  let maxIdentifierNumber = getMaxIdentifierNumber(projectId, trees);
  return () => ++maxIdentifierNumber;
}
