import { extractA } from "../strings/extract-a.ts";
import {
  containsA,
  isOnlyA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import { PROJECT_ID_REGEX, type ProjectId } from "./project-id.ts";
import { capture, sequence } from "../strings/regex.ts";
import { TASK_ID_NUMBER_REGEX, TaskIdNumber } from "./task-id-number.ts";

export function createTaskIdRegex<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): RegExp {
  return capture(
    "taskId",
    sequence(
      projectId,
      /-/,
      TASK_ID_NUMBER_REGEX,
    ),
  );
}
export type TaskId<PI extends ProjectId = ProjectId> = `${PI}-${TaskIdNumber}`;

export function createIsTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<TaskId<PI>> {
  return isOnlyA<TaskId<PI>>(createTaskIdRegex(projectId));
}

export function createContainsTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return containsA<TaskId<PI>>(createTaskIdRegex(projectId));
}

export function createExtractTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return extractA<TaskId<PI>>(createTaskIdRegex(projectId));
}
