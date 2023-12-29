import { capture, sequence } from "../strings/regex.ts";
import {
  isOnlyA,
  startsWithA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import { createTaskIdPlaceholderRegex } from "./task-id-placeholder.ts";
import { createTaskIdRegex, TaskId } from "./task-id.ts";

export type BoxContents = " " | "x";
export const BOX_CONTENTS_REGEX = /(?<boxContents>[ x])/;
export const isBoxContents: TextTypeGuard<BoxContents> = isOnlyA<BoxContents>(
  BOX_CONTENTS_REGEX,
);

export type Box = `^[${BoxContents}]`;
export const BOX_REGEX = capture(
  "box",
  sequence("[", BOX_CONTENTS_REGEX, "]"),
);
export const isBox: TextTypeGuard<Box> = isOnlyA<Box>(BOX_REGEX);

export type BoxAndTaskId = `${Box} ${TaskId}`;
export function createBoxAndTaskIdRegex<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(BOX_REGEX, " ", createTaskIdRegex(projectId));
}
export function createBoxAndTaskIdPlaceholderRegex<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(BOX_REGEX, " ", createTaskIdPlaceholderRegex(projectId));
}

export function createIsBoxAndTaskId(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<BoxAndTaskId> {
  return isOnlyA<BoxAndTaskId>(
    createBoxAndTaskIdRegex(projectId),
  );
}

export function createExtractBoxAndTaskId(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<BoxAndTaskId> {
  return startsWithA<
    BoxAndTaskId
  >(createBoxAndTaskIdRegex(projectId));
}
