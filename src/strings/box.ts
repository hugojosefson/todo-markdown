import {
  capture,
  isA,
  sequence,
  startsWithA,
  type TypeGuard,
} from "../regex.ts";
import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import { createTaskIdRegex, TaskId } from "./task-id.ts";

export type BoxContents = " " | "x";
export const BOX_CONTENTS_REGEX = /(?<boxContents>[ x])/;
export const isBoxContents: TypeGuard<BoxContents> = isA<BoxContents>(
  BOX_CONTENTS_REGEX,
);

export type Box = `^[${BoxContents}]`;
export const BOX_REGEX = capture(
  "box",
  sequence("[", BOX_CONTENTS_REGEX, "]"),
);
export const isBox: TypeGuard<Box> = isA<Box>(BOX_REGEX);

export type BoxAndTaskId = `${Box} ${TaskId}`;
export function createBoxAndTaskIdRegex(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(BOX_REGEX, " ", createTaskIdRegex(projectId));
}
export function createIsBoxAndTaskId(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
): TypeGuard<BoxAndTaskId> {
  return isA<BoxAndTaskId>(
    createBoxAndTaskIdRegex(projectId),
  );
}

export function createExtractBoxAndTaskId(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
): TypeGuard<BoxAndTaskId> {
  return startsWithA<
    BoxAndTaskId
  >(createBoxAndTaskIdRegex(projectId));
}
