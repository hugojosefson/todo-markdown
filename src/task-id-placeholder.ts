import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import { containsA, isA, sequence, TypeGuard } from "./regex.ts";
import {
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
  TaskIdNumberPlaceholder,
} from "./task-id-number-placeholder.ts";

export const TASK_ID_PLACEHOLDER_REGEX = sequence(
  PROJECT_ID_REGEX,
  /-/,
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);
export type TaskIdPlaceholder = `${ProjectId}-${TaskIdNumberPlaceholder}`;
export const isTaskIdPlaceholder: TypeGuard<TaskIdPlaceholder> = isA<
  TaskIdPlaceholder
>(TASK_ID_PLACEHOLDER_REGEX);
export const containsTaskIdPlaceholder = containsA<TaskIdPlaceholder>(
  TASK_ID_PLACEHOLDER_REGEX,
);
