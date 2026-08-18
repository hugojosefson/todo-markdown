import { or } from "@hugojosefson/fns/string/regex";
import {
  containsA,
  isOnlyA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import {
  createTaskIdPlaceholderRegex,
  TaskIdPlaceholder,
} from "./task-id-placeholder.ts";
import { createTaskIdRegex, TaskId } from "./task-id.ts";

export type TaskIdish<PI extends ProjectId = ProjectId> =
  | TaskId
  | TaskIdPlaceholder<PI>;
export function createTaskIdishRegex<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return or(
    createTaskIdRegex(projectId),
    createTaskIdPlaceholderRegex(projectId),
  );
}
export function createIsATaskIdish(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<TaskIdish> {
  return isOnlyA<TaskIdish>(
    createTaskIdishRegex(projectId),
  );
}
export function createContainsTaskIdish(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
) {
  return containsA<TaskIdish>(createTaskIdishRegex(projectId));
}
