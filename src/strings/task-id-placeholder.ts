import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import { containsA, isA, sequence, TypeGuard } from "../regex.ts";
import {
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
  TaskIdNumberPlaceholder,
} from "./task-id-number-placeholder.ts";

export function createTaskIdPlaceholderRegex(
  projectId: ProjectId | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(
    projectId,
    /-/,
    TASK_ID_NUMBER_PLACEHOLDER_REGEX,
  );
}
export type TaskIdPlaceholder<PI extends ProjectId = ProjectId> =
  `${PI}-${TaskIdNumberPlaceholder}`;
export function createIsTaskIdPlaceholder<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): TypeGuard<TaskIdPlaceholder<PI>> {
  return isA<
    TaskIdPlaceholder
  >(createTaskIdPlaceholderRegex(projectId));
}
export function createContainsTaskIdPlaceholder<
  PI extends ProjectId = ProjectId,
>(projectId: PI | RegExp = PROJECT_ID_REGEX) {
  return containsA<TaskIdPlaceholder<PI>>(
    createTaskIdPlaceholderRegex(projectId),
  );
}
